package com.klu.service;

import com.klu.dto.RiskScoreDetails;
import com.klu.model.Cab;
import com.klu.model.Flight;
import com.klu.model.Hotel;
import com.klu.model.RiskLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Predefined business rule-based travel risk scoring engine.
 * Computes risk scores from 0-100 based strictly on observable booking parameters:
 * stops, connection buffer, seat scarcity, vehicle transit duration, room availability, and rating.
 *
 * Risk Level Thresholds:
 * - LOW: 0 - 29
 * - MEDIUM: 30 - 60
 * - HIGH: 61 - 100
 */
@Service
@Slf4j
public class RiskScoringEngine {

    /**
     * Compute rule-based risk score details for a flight.
     */
    public RiskScoreDetails scoreFlight(Flight flight) {
        double score = 15.0; // Rule-based baseline score for scheduled commercial flights
        List<String> explanations = new ArrayList<>();
        Map<String, Object> telemetry = new LinkedHashMap<>();

        int stops = flight.getStops();
        double transferRisk;

        // 1. Flight stops rule
        if (stops == 0) {
            transferRisk = 0.0;
            explanations.add("Rule: Direct non-stop flight eliminates connection and layover disruption hazards (+0 pts).");
        } else if (stops == 1) {
            score += 25.0;
            transferRisk = 35.0;
            explanations.add("Rule: 1-stop connection introduces layover transfer vulnerability (+25 risk pts).");
        } else {
            score += 50.0;
            transferRisk = 70.0;
            explanations.add(String.format("Rule: Multi-stop connection (%d stops) substantially increases misconnection hazard (+50 risk pts).", stops));
        }

        // 2. Departure schedule rule (Airport peak congestion: 07:00-09:30 or 17:30-20:30)
        int depHour = parseDepartureHour(flight.getDepartureTime());
        boolean isPeak = (depHour >= 7 && depHour <= 9) || (depHour >= 17 && depHour <= 20);
        if (isPeak) {
            score += 15.0;
            explanations.add(String.format("Rule: Scheduled departure at %s falls into airport peak hours (runway/terminal congestion: +15 risk pts).", flight.getDepartureTime()));
        } else {
            explanations.add(String.format("Rule: Off-peak departure at %s minimizes gate delays and terminal congestion (+0 pts).", flight.getDepartureTime()));
        }

        // 3. Available seats (inventory volatility)
        int seats = flight.getAvailableSeats();
        if (seats <= 5) {
            score += 20.0;
            explanations.add(String.format("Rule: Critical seat scarcity (%d seats remaining) - high risk of fare surge or sell-out (+20 risk pts).", seats));
        } else if (seats <= 15) {
            score += 10.0;
            explanations.add(String.format("Rule: Limited seat inventory (%d seats remaining) (+10 risk pts).", seats));
        } else {
            explanations.add(String.format("Rule: Ample seat availability (%d seats remaining) (+0 pts).", seats));
        }

        // 4. Scheduled duration rule
        int durationMins = parseDurationMinutes(flight.getDuration());
        if (durationMins > 240) {
            score += 10.0;
            explanations.add(String.format("Rule: Long scheduled flight duration (%s, %d mins) increases crew rotation/delay exposure (+10 risk pts).", flight.getDuration(), durationMins));
        }

        // 5. Airline operational profile
        String airline = flight.getAirline() != null ? flight.getAirline().trim() : "";
        double airlineOtp;
        if (airline.equalsIgnoreCase("IndiGo") || airline.equalsIgnoreCase("Vistara")) {
            score -= 10.0;
            airlineOtp = 90.0;
            explanations.add(String.format("Rule: %s possesses a proven high on-time operational reliability (-10 risk deduction).", airline));
        } else if (airline.equalsIgnoreCase("Air India") || airline.equalsIgnoreCase("Akasa Air")) {
            score -= 5.0;
            airlineOtp = 84.0;
            explanations.add(String.format("Rule: %s maintains standard domestic on-time dispatch rates (-5 risk deduction).", airline));
        } else {
            score += 5.0;
            airlineOtp = 72.0;
            explanations.add(String.format("Rule: %s operational schedule has higher turnaround variance (+5 risk pts).", airline));
        }

        // Rating bonus
        if (flight.getRating() >= 4.4) {
            score -= 3.0;
            explanations.add(String.format("Rule: High passenger rating (%.1f/5.0) reflects consistent service delivery (-3 risk deduction).", flight.getRating()));
        }

        // Clamp final score between 5.0 and 95.0
        double finalScore = round(Math.min(95.0, Math.max(5.0, score)), 1);
        RiskLevel level = classify(finalScore);

        telemetry.put("stops", stops);
        telemetry.put("departureHour", depHour);
        telemetry.put("isPeakHour", isPeak);
        telemetry.put("availableSeats", seats);
        telemetry.put("scheduledDurationMinutes", durationMins);
        telemetry.put("airline", airline);
        telemetry.put("airlineOnTimeRate", airlineOtp);
        telemetry.put("assessmentMethod", "Predefined Deterministic Business Rules");

        return RiskScoreDetails.builder()
                .riskScore(finalScore)
                .riskLevel(level)
                .disruptionRisk(finalScore)
                .transferRisk(transferRisk)
                .punctualityScore(airlineOtp)
                .explanations(explanations)
                .telemetry(telemetry)
                .build();
    }

    /**
     * Compute rule-based risk score details for a cab transfer.
     */
    public RiskScoreDetails scoreCab(Cab cab) {
        double score = 15.0; // Rule-based baseline
        List<String> explanations = new ArrayList<>();
        Map<String, Object> telemetry = new LinkedHashMap<>();

        String pickup = cab.getPickupLocation() != null ? cab.getPickupLocation() : "";
        String drop = cab.getDropLocation() != null ? cab.getDropLocation() : "";
        int durationMins = parseDurationMinutes(cab.getEstimatedDuration());

        boolean isAirportTransfer = pickup.toLowerCase().contains("airport") || drop.toLowerCase().contains("airport");

        // 1. Route transit duration / distance rule
        if (durationMins > 60) {
            score += 25.0;
            explanations.add(String.format("Rule: Long transit duration (%d mins) on route '%s' to '%s' increases road exposure (+25 risk pts).", durationMins, pickup, drop));
        } else if (durationMins > 30) {
            score += 15.0;
            explanations.add(String.format("Rule: Moderate transit duration (%d mins) (+15 risk pts).", durationMins));
        } else {
            score += 5.0;
            explanations.add(String.format("Rule: Short quick transit distance (%d mins) reduces transit variability (+5 risk pts).", durationMins));
        }

        // 2. Airport corridor vs intra-city arterial rule
        if (isAirportTransfer) {
            score -= 5.0;
            explanations.add("Rule: Dedicated airport expressway route with clear signage (-5 risk deduction).");
        } else {
            score += 5.0;
            explanations.add("Rule: Arterial intra-city route with signalized intersections (+5 risk pts).");
        }

        // 3. Provider dispatch reliability rule
        String provider = cab.getProvider() != null ? cab.getProvider() : "Cab";
        double reliabilityRate;
        if (provider.equalsIgnoreCase("Uber") || provider.equalsIgnoreCase("Ola")) {
            score -= 5.0;
            reliabilityRate = 92.0;
            explanations.add(String.format("Rule: Platform %s utilizes GPS tracking and automated driver assignment (-5 risk deduction).", provider));
        } else {
            score += 5.0;
            reliabilityRate = 80.0;
            explanations.add(String.format("Rule: Traditional operator %s dispatch (+5 risk pts).", provider));
        }

        double finalScore = round(Math.min(90.0, Math.max(10.0, score)), 1);
        RiskLevel level = classify(finalScore);

        telemetry.put("pickupLocation", pickup);
        telemetry.put("dropLocation", drop);
        telemetry.put("isAirportTransfer", isAirportTransfer);
        telemetry.put("estimatedDurationMinutes", durationMins);
        telemetry.put("provider", provider);
        telemetry.put("reliabilityRate", reliabilityRate);
        telemetry.put("assessmentMethod", "Predefined Deterministic Business Rules");

        return RiskScoreDetails.builder()
                .riskScore(finalScore)
                .riskLevel(level)
                .disruptionRisk(finalScore)
                .transferRisk(0.0)
                .punctualityScore(reliabilityRate)
                .explanations(explanations)
                .telemetry(telemetry)
                .build();
    }

    /**
     * Compute rule-based risk score details for hotel booking.
     */
    public RiskScoreDetails scoreHotel(Hotel hotel) {
        double score = 15.0;
        List<String> explanations = new ArrayList<>();
        Map<String, Object> telemetry = new LinkedHashMap<>();

        // 1. Room availability rule
        int rooms = hotel.getAvailableRooms();
        if (rooms <= 2) {
            score += 30.0;
            explanations.add(String.format("Rule: Severe room shortage (%d rooms remaining) - immediate booking needed (+30 risk pts).", rooms));
        } else if (rooms <= 5) {
            score += 15.0;
            explanations.add(String.format("Rule: Limited room stock (%d rooms remaining) (+15 risk pts).", rooms));
        } else {
            explanations.add(String.format("Rule: Healthy room inventory (%d rooms available) (+0 pts).", rooms));
        }

        // 2. Guest rating rule
        double rating = hotel.getRating();
        if (rating >= 4.5) {
            score -= 10.0;
            explanations.add(String.format("Rule: Exceptional guest rating (%.1f/5.0) guarantees premium service consistency (-10 risk deduction).", rating));
        } else if (rating >= 4.0) {
            score -= 5.0;
            explanations.add(String.format("Rule: Good guest rating (%.1f/5.0) (-5 risk deduction).", rating));
        } else if (rating < 3.5) {
            score += 20.0;
            explanations.add(String.format("Rule: Lower guest satisfaction rating (%.1f/5.0) indicates service variance (+20 risk pts).", rating));
        }

        // 3. Location distance / accessibility rule
        String location = hotel.getLocation() != null ? hotel.getLocation().toLowerCase() : "";
        if (location.contains("airport") || location.contains("aerocity")) {
            score -= 5.0;
            explanations.add("Rule: Located directly adjacent to airport transport terminal (-5 risk deduction).");
        } else if (location.contains("center") || location.contains("central") || location.contains("road")) {
            explanations.add("Rule: Centrally located hotel with convenient urban access (+0 pts).");
        }

        double finalScore = round(Math.min(95.0, Math.max(5.0, score)), 1);
        RiskLevel level = classify(finalScore);

        telemetry.put("hotelName", hotel.getHotelName());
        telemetry.put("location", hotel.getLocation());
        telemetry.put("availableRooms", rooms);
        telemetry.put("rating", rating);
        telemetry.put("assessmentMethod", "Predefined Deterministic Business Rules");

        return RiskScoreDetails.builder()
                .riskScore(finalScore)
                .riskLevel(level)
                .disruptionRisk(finalScore)
                .transferRisk(0.0)
                .punctualityScore(round(rating * 20.0, 1))
                .explanations(explanations)
                .telemetry(telemetry)
                .build();
    }

    /**
     * Classify risk score according to predefined thresholds:
     * LOW: 0 - 29
     * MEDIUM: 30 - 60
     * HIGH: 61 - 100
     */
    public RiskLevel classify(double score) {
        if (score < 30.0) {
            return RiskLevel.LOW;
        } else if (score <= 60.0) {
            return RiskLevel.MEDIUM;
        } else {
            return RiskLevel.HIGH;
        }
    }

    /**
     * Parse departure hour from time string like "07:30" or "09:00 AM".
     */
    public int parseDepartureHour(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 10;
        try {
            String clean = timeStr.trim().split(" ")[0];
            String[] parts = clean.split(":");
            return Integer.parseInt(parts[0]);
        } catch (Exception e) {
            return 10;
        }
    }

    /**
     * Parse duration in minutes from strings like "2h 15m", "1h 30m", "45 mins".
     */
    public int parseDurationMinutes(String durationStr) {
        if (durationStr == null || durationStr.trim().isEmpty()) return 120;
        int total = 0;
        try {
            String lower = durationStr.toLowerCase().trim();
            if (lower.contains("h")) {
                String[] parts = lower.split("h");
                total += Integer.parseInt(parts[0].trim()) * 60;
                if (parts.length > 1 && parts[1].contains("m")) {
                    String minsPart = parts[1].replace("m", "").replace("ins", "").trim();
                    if (!minsPart.isEmpty()) {
                        total += Integer.parseInt(minsPart);
                    }
                }
            } else if (lower.contains("m")) {
                String clean = lower.replace("mins", "").replace("m", "").trim();
                total += Integer.parseInt(clean);
            } else {
                total = 120;
            }
        } catch (Exception e) {
            total = 120;
        }
        return total > 0 ? total : 120;
    }

    private double round(double val, int places) {
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
