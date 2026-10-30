package com.klu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.dto.*;
import com.klu.model.*;
import com.klu.repository.CabRepository;
import com.klu.repository.FlightRepository;
import com.klu.repository.HotelRepository;
import com.klu.repository.RiskAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAssessmentService {

    private final RiskScoringEngine scoringEngine;
    private final FlightService flightService;
    private final FlightRepository flightRepository;
    private final CabRepository cabRepository;
    private final HotelRepository hotelRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Rank and risk-assess flights matching search criteria according to user preferences.
     */
    @Transactional
    public List<RiskRankedFlightResponse> rankFlights(String source, String destination, RankingCriteria criteria) {
        if (criteria == null) {
            criteria = RankingCriteria.BALANCED;
        }

        List<Flight> flights = flightService.searchFlights(source, destination);

        if (flights.isEmpty()) {
            return Collections.emptyList();
        }

        // Determine price and duration extents for normalization
        double minPrice = flights.stream().mapToDouble(Flight::getPrice).min().orElse(1.0);
        double maxPrice = flights.stream().mapToDouble(Flight::getPrice).max().orElse(1.0);

        int minDuration = flights.stream().mapToInt(f -> scoringEngine.parseDurationMinutes(f.getDuration())).min().orElse(60);
        int maxDuration = flights.stream().mapToInt(f -> scoringEngine.parseDurationMinutes(f.getDuration())).max().orElse(180);

        // Weights based on user ranking criteria
        final double wSafety;
        final double wPrice;
        final double wDuration;
        final double wTransfer;

        switch (criteria) {
            case LOWEST_RISK -> {
                wSafety = 0.60;
                wTransfer = 0.20;
                wPrice = 0.10;
                wDuration = 0.10;
            }
            case FASTEST -> {
                wDuration = 0.60;
                wTransfer = 0.20;
                wSafety = 0.10;
                wPrice = 0.10;
            }
            case BUDGET -> {
                wPrice = 0.70;
                wSafety = 0.15;
                wDuration = 0.10;
                wTransfer = 0.05;
            }
            default -> { // BALANCED
                wSafety = 0.30;
                wPrice = 0.30;
                wDuration = 0.25;
                wTransfer = 0.15;
            }
        }

        List<RiskRankedFlightResponse> rankedList = new ArrayList<>();

        for (Flight flight : flights) {
            RiskScoreDetails details = scoringEngine.scoreFlight(flight);

            // Normalized Price Score (cheapest is 100)
            double priceScore = maxPrice == minPrice ? 100.0 :
                    round(100.0 * (maxPrice - flight.getPrice()) / (maxPrice - minPrice), 1);

            // Normalized Duration Score (shortest is 100)
            int duration = scoringEngine.parseDurationMinutes(flight.getDuration());
            double durationScore = maxDuration == minDuration ? 100.0 :
                    round(100.0 * (maxDuration - duration) / (double) (maxDuration - minDuration), 1);

            double safetyScore = 100.0 - details.getRiskScore();
            double transferSafety = 100.0 - details.getTransferRisk();

            double compositeScore = round(
                    (safetyScore * wSafety) +
                    (priceScore * wPrice) +
                    (durationScore * wDuration) +
                    (transferSafety * wTransfer),
                    1
            );

            details.setPriceScore(priceScore);
            details.setDurationScore(durationScore);
            details.setRecommendationScore(compositeScore);

            rankedList.add(RiskRankedFlightResponse.builder()
                    .flight(flight)
                    .riskDetails(details)
                    .build());
        }

        // Sort descending by recommendationScore
        rankedList.sort((a, b) -> Double.compare(
                b.getRiskDetails().getRecommendationScore(),
                a.getRiskDetails().getRecommendationScore()
        ));

        // Assign ranks and persist top candidates in PostgreSQL
        for (int i = 0; i < rankedList.size(); i++) {
            RiskRankedFlightResponse item = rankedList.get(i);
            int rank = i + 1;
            item.getRiskDetails().setRank(rank);

            persistAssessment(
                    "FLIGHT",
                    item.getFlight().getFlightId(),
                    item.getRiskDetails(),
                    rank
            );
        }

        return rankedList;
    }

    /**
     * Get or compute rule-based risk details for a single flight by ID.
     */
    @Transactional
    public RiskRankedFlightResponse getRiskForFlight(Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found with ID: " + flightId));

        RiskScoreDetails details = scoringEngine.scoreFlight(flight);
        details.setRank(1);
        details.setRecommendationScore(round(100.0 - details.getRiskScore(), 1));

        persistAssessment("FLIGHT", flight.getFlightId(), details, 1);

        return RiskRankedFlightResponse.builder()
                .flight(flight)
                .riskDetails(details)
                .build();
    }

    /**
     * Get or compute rule-based risk details for a single cab by ID.
     */
    @Transactional
    public RiskRankedCabResponse getRiskForCab(Long cabId) {
        Cab cab = cabRepository.findById(cabId)
                .orElseThrow(() -> new RuntimeException("Cab not found with ID: " + cabId));

        RiskScoreDetails details = scoringEngine.scoreCab(cab);
        details.setRank(1);
        details.setRecommendationScore(round(100.0 - details.getRiskScore(), 1));

        persistAssessment("CAB", cab.getCabId(), details, 1);

        return RiskRankedCabResponse.builder()
                .cab(cab)
                .riskDetails(details)
                .build();
    }

    /**
     * Comprehensive multi-modal itinerary risk assessment combining flight, hotel, and cab.
     */
    @Transactional
    public ItineraryRiskResponse assessItinerary(ItineraryRiskRequest req) {
        RiskScoreDetails flightRisk = null;
        RiskScoreDetails cabRisk = null;
        RiskScoreDetails hotelRisk = null;
        Flight flight = null;
        Cab cab = null;
        Hotel hotel = null;

        if (req.getFlightId() != null) {
            flight = flightRepository.findById(req.getFlightId()).orElse(null);
            if (flight != null) {
                flightRisk = scoringEngine.scoreFlight(flight);
            }
        }

        if (req.getCabId() != null) {
            cab = cabRepository.findById(req.getCabId()).orElse(null);
            if (cab != null) {
                cabRisk = scoringEngine.scoreCab(cab);
            }
        }

        if (req.getHotelId() != null) {
            hotel = hotelRepository.findById(req.getHotelId()).orElse(null);
            if (hotel != null) {
                hotelRisk = scoringEngine.scoreHotel(hotel);
            }
        }

        // Connection buffer calculation
        double bufferMinutes = 60.0; // Default healthy buffer
        String bufferAssessment = "Adequate Transfer Buffer";
        List<String> tripExplanations = new ArrayList<>();
        List<String> mitigations = new ArrayList<>();

        if (flight != null && cab != null) {
            int arrivalMins = parseTimeToMinutes(flight.getArrivalTime());
            int pickupMins = req.getCabPickupTime() != null ?
                    parseTimeToMinutes(req.getCabPickupTime()) :
                    arrivalMins + 45; // Default 45 mins after arrival

            int diff = pickupMins - arrivalMins;
            if (diff < -720) {
                // Next day pickup buffer across midnight
                diff += 1440;
            }
            bufferMinutes = diff;

            if (diff < 0) {
                bufferAssessment = "Scheduling Conflict (Cab scheduled before flight landing)";
                tripExplanations.add(String.format("Critical scheduling conflict: Cab pickup (%s) is scheduled before flight arrival (%s).", req.getCabPickupTime(), flight.getArrivalTime()));
                mitigations.add("Immediate action: Reschedule cab pickup to at least 45 minutes after flight arrival time.");
            } else if (diff < 30) {
                bufferAssessment = "Critical Transfer Window (< 30 mins) - High Risk of Missing Cab";
                tripExplanations.add(String.format("Very tight gap (%d mins) between flight landing (%s) and cab pickup (%s). Baggage retrieval and deplaning typically require 35-45 minutes.", diff, flight.getArrivalTime(), req.getCabPickupTime()));
                mitigations.add("Recommended action: Reschedule cab pickup to at least 45 minutes after flight scheduled arrival.");
            } else if (diff < 50) {
                bufferAssessment = "Moderate Connection Buffer (30 - 50 mins)";
                tripExplanations.add(String.format("Moderate buffer (%d mins). Minor flight tarmac delays may cause hurried airport exit.", diff));
                mitigations.add("Consider opting for priority baggage or web check-in to clear airport gates expeditiously.");
            } else {
                bufferAssessment = "Comfortable Connection Buffer (> 50 mins)";
                tripExplanations.add(String.format("Generous %d-minute buffer ensures comfortable transfer to cab without rush.", diff));
            }
        }

        // Overall trip composite risk calculation
        double tripRisk;
        if (flightRisk != null && cabRisk != null && hotelRisk != null) {
            double bufferRiskPenalty = bufferMinutes < 0 ? 50.0 : bufferMinutes < 30 ? 30.0 : bufferMinutes < 45 ? 12.0 : 0.0;
            tripRisk = round((flightRisk.getRiskScore() * 0.50) + (cabRisk.getRiskScore() * 0.20) + (hotelRisk.getRiskScore() * 0.15) + bufferRiskPenalty, 1);
        } else if (flightRisk != null && cabRisk != null) {
            double bufferRiskPenalty = bufferMinutes < 0 ? 50.0 : bufferMinutes < 30 ? 25.0 : bufferMinutes < 45 ? 10.0 : 0.0;
            tripRisk = round((flightRisk.getRiskScore() * 0.65) + (cabRisk.getRiskScore() * 0.25) + bufferRiskPenalty, 1);
        } else if (flightRisk != null) {
            tripRisk = flightRisk.getRiskScore();
        } else if (cabRisk != null) {
            tripRisk = cabRisk.getRiskScore();
        } else if (hotelRisk != null) {
            tripRisk = hotelRisk.getRiskScore();
        } else {
            tripRisk = 20.0;
        }

        RiskLevel tripRiskLevel = scoringEngine.classify(tripRisk);

        if (flightRisk != null) {
            tripExplanations.addAll(flightRisk.getExplanations());
        }
        if (cabRisk != null) {
            tripExplanations.addAll(cabRisk.getExplanations());
        }
        if (hotelRisk != null) {
            tripExplanations.addAll(hotelRisk.getExplanations());
        }

        if (mitigations.isEmpty()) {
            mitigations.add("Track scheduled status via TravelEase travel dashboard on travel day.");
            mitigations.add("Download offline itinerary and booking confirmation for quick terminal verification.");
        }

        double compositeRecommendation = round(Math.max(5.0, 100.0 - tripRisk), 1);

        ItineraryRiskResponse response = ItineraryRiskResponse.builder()
                .overallTripRiskScore(tripRisk)
                .overallTripRiskLevel(tripRiskLevel)
                .compositeRecommendationScore(compositeRecommendation)
                .flightRisk(flightRisk)
                .cabRisk(cabRisk)
                .hotelRisk(hotelRisk)
                .transferBufferMinutes(bufferMinutes)
                .transferBufferAssessment(bufferAssessment)
                .tripLevelExplanations(tripExplanations)
                .actionableMitigations(mitigations)
                .build();

        // Persist itinerary assessment
        RiskScoreDetails summaryDetails = RiskScoreDetails.builder()
                .riskScore(tripRisk)
                .riskLevel(tripRiskLevel)
                .disruptionRisk(flightRisk != null ? flightRisk.getDisruptionRisk() : 20.0)
                .transferRisk(bufferMinutes < 30 ? 60.0 : 15.0)
                .recommendationScore(compositeRecommendation)
                .rank(1)
                .explanations(tripExplanations)
                .build();

        persistAssessment("ITINERARY", req.getFlightId() != null ? req.getFlightId() : 0L, summaryDetails, 1);

        return response;
    }

    /**
     * Get recent risk assessments persisted in PostgreSQL.
     */
    public List<RiskAssessment> getRecentAssessments() {
        return riskAssessmentRepository.findTop10ByOrderByAssessedAtDesc();
    }

    private void persistAssessment(String optionType, Long optionId, RiskScoreDetails details, int rank) {
        try {
            String telemetry = details.getTelemetry() != null ?
                    objectMapper.writeValueAsString(details.getTelemetry()) : null;

            RiskAssessment assessment = RiskAssessment.builder()
                    .optionType(optionType)
                    .optionId(optionId != null ? optionId : 0L)
                    .riskScore(details.getRiskScore())
                    .riskLevel(details.getRiskLevel())
                    .disruptionRisk(details.getDisruptionRisk())
                    .transferRisk(details.getTransferRisk())
                    .priceScore(details.getPriceScore())
                    .durationScore(details.getDurationScore())
                    .recommendationScore(details.getRecommendationScore())
                    .rankPosition(rank)
                    .explanations(details.getExplanations() != null ? new ArrayList<>(details.getExplanations()) : new ArrayList<>())
                    .telemetryJson(telemetry)
                    .assessedAt(LocalDateTime.now())
                    .build();

            riskAssessmentRepository.save(assessment);
        } catch (Exception e) {
            log.warn("Failed to persist risk assessment in PostgreSQL: {}", e.getMessage());
        }
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 720;
        try {
            String[] parts = timeStr.trim().split(" ")[0].split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 720;
        }
    }

    private double round(double val, int places) {
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
