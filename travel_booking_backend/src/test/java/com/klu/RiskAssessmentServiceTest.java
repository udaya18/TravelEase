package com.klu;

import com.klu.dto.*;
import com.klu.model.*;
import com.klu.repository.CabRepository;
import com.klu.repository.FlightRepository;
import com.klu.repository.HotelRepository;
import com.klu.repository.RiskAssessmentRepository;
import com.klu.service.FlightService;
import com.klu.service.RiskAssessmentService;
import com.klu.service.RiskScoringEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RiskAssessmentServiceTest {

    private RiskScoringEngine scoringEngine;
    private RiskAssessmentService assessmentService;

    @Mock
    private FlightService flightService;

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private CabRepository cabRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    private Flight directFlight;
    private Flight multiStopFlight;
    private Flight peakHourFlight;
    private Cab sampleCab;
    private Hotel sampleHotel;

    @BeforeEach
    void setUp() {
        scoringEngine = new RiskScoringEngine();

        assessmentService = new RiskAssessmentService(
                scoringEngine,
                flightService,
                flightRepository,
                cabRepository,
                hotelRepository,
                riskAssessmentRepository
        );

        directFlight = new Flight(
                1L, "IndiGo", "6E-101", "Hyderabad", "Delhi",
                "11:00", "13:15", "2h 15m", 0, 4200.0, 45, 4.4, "AVAILABLE"
        );

        multiStopFlight = new Flight(
                2L, "SpiceJet", "SG-404", "Hyderabad", "Delhi",
                "07:30", "13:30", "6h 00m", 2, 3200.0, 4, 3.8, "AVAILABLE"
        );

        peakHourFlight = new Flight(
                3L, "Air India", "AI-202", "Hyderabad", "Delhi",
                "08:00", "10:15", "2h 15m", 0, 5100.0, 30, 4.1, "AVAILABLE"
        );

        sampleCab = new Cab(
                10L, "Uber", "Sedan", "IGI Airport T3, Delhi", "Connaught Place, Delhi",
                4, 650.0, "45 mins", "AVAILABLE"
        );

        sampleHotel = new Hotel(
                20L, "Taj Palace", "Aerocity, Delhi", "Luxury 5-star hotel near airport",
                "Deluxe King", 8500.0, 12, 4.8, "https://images.unsplash.com/photo-1566073771259-6a8506099945", "AVAILABLE"
        );
    }

    @Test
    @DisplayName("Rule: Direct flight has 0% transfer risk and is classified as LOW risk")
    void testDirectVsMultiStopRisk() {
        RiskScoreDetails directScore = scoringEngine.scoreFlight(directFlight);
        RiskScoreDetails multiStopScore = scoringEngine.scoreFlight(multiStopFlight);

        assertEquals(0.0, directScore.getTransferRisk(), "Direct flight should have 0.0 transfer risk");
        assertTrue(multiStopScore.getTransferRisk() >= 70.0, "Multi-stop flight should have elevated transfer risk");
        assertTrue(directScore.getRiskScore() < multiStopScore.getRiskScore(), "Direct flight risk score should be lower than multi-stop");
        assertEquals(RiskLevel.LOW, directScore.getRiskLevel(), "Direct off-peak flight should be classified as LOW risk");
        assertTrue(directScore.getExplanations().stream().anyMatch(e -> e.contains("Direct non-stop")), "Should explain direct non-stop rule");
    }

    @Test
    @DisplayName("Rule: Peak departure hour (08:00) incurs airport congestion penalty")
    void testPeakHourPenalty() {
        RiskScoreDetails offPeakScore = scoringEngine.scoreFlight(directFlight); // 11:00
        RiskScoreDetails peakScore = scoringEngine.scoreFlight(peakHourFlight);  // 08:00

        assertTrue(peakScore.getDisruptionRisk() > offPeakScore.getDisruptionRisk(),
                "Peak hour flight should have higher risk than off-peak");
        assertTrue(peakScore.getExplanations().stream().anyMatch(e -> e.contains("airport peak hours")),
                "Explanation should cite airport peak hours rule");
    }

    @Test
    @DisplayName("Rule: Hotel scoring incorporates room availability and guest rating")
    void testHotelRiskScoring() {
        RiskScoreDetails hotelScore = scoringEngine.scoreHotel(sampleHotel);

        assertNotNull(hotelScore);
        assertEquals(RiskLevel.LOW, hotelScore.getRiskLevel(), "Taj Palace with 4.8 rating and 12 rooms should be LOW risk");
        assertTrue(hotelScore.getExplanations().stream().anyMatch(e -> e.contains("Exceptional guest rating")),
                "Should acknowledge high guest rating rule");
    }

    @Test
    @DisplayName("Multi-criteria ranking prioritizes safest option under LOWEST_RISK criteria")
    void testLowestRiskRanking() {
        when(flightService.searchFlights("Hyderabad", "Delhi"))
                .thenReturn(Arrays.asList(directFlight, multiStopFlight, peakHourFlight));

        List<RiskRankedFlightResponse> results = assessmentService.rankFlights("Hyderabad", "Delhi", RankingCriteria.LOWEST_RISK);

        assertNotNull(results);
        assertEquals(3, results.size());
        assertEquals("6E-101", results.get(0).getFlight().getFlightNumber(), "Safest direct off-peak flight should rank #1 for LOWEST_RISK");
        assertEquals(1, results.get(0).getRiskDetails().getRank());
        verify(riskAssessmentRepository, atLeastOnce()).save(any(RiskAssessment.class));
    }

    @Test
    @DisplayName("Multi-criteria ranking prioritizes cheapest option under BUDGET criteria")
    void testBudgetRanking() {
        when(flightService.searchFlights("Hyderabad", "Delhi"))
                .thenReturn(Arrays.asList(directFlight, multiStopFlight, peakHourFlight));

        List<RiskRankedFlightResponse> results = assessmentService.rankFlights("Hyderabad", "Delhi", RankingCriteria.BUDGET);

        assertNotNull(results);
        assertEquals(3, results.size());
        // Cheapest is multiStopFlight (3200 vs 4200 vs 5100)
        assertEquals("SG-404", results.get(0).getFlight().getFlightNumber(), "Cheapest flight should rank #1 for BUDGET");
    }

    @Test
    @DisplayName("Itinerary assessment detects tight transfer buffer (< 30 min) and generates rule-based mitigations")
    void testTightConnectionBufferDetection() {
        when(flightRepository.findById(1L)).thenReturn(Optional.of(directFlight)); // lands 13:15
        when(cabRepository.findById(10L)).thenReturn(Optional.of(sampleCab));

        // Cab pickup set to 13:30 (only 15 mins after landing)
        ItineraryRiskRequest req = ItineraryRiskRequest.builder()
                .flightId(1L)
                .cabId(10L)
                .cabPickupTime("13:30")
                .build();

        ItineraryRiskResponse response = assessmentService.assessItinerary(req);

        assertNotNull(response);
        assertEquals(15.0, response.getTransferBufferMinutes());
        assertTrue(response.getTransferBufferAssessment().contains("Critical Transfer Window"), "Should flag critical buffer");
        assertTrue(response.getActionableMitigations().stream().anyMatch(m -> m.contains("Reschedule cab pickup")),
                "Should include actionable reschedule mitigation");
        verify(riskAssessmentRepository, times(1)).save(any(RiskAssessment.class));
    }

    @Test
    @DisplayName("Itinerary assessment detects scheduling conflict when cab is scheduled earlier than flight landing")
    void testSchedulingConflictDetection() {
        when(flightRepository.findById(1L)).thenReturn(Optional.of(directFlight)); // lands 13:15
        when(cabRepository.findById(10L)).thenReturn(Optional.of(sampleCab));

        // Cab pickup set to 12:00 (1 hour and 15 mins before landing!)
        ItineraryRiskRequest req = ItineraryRiskRequest.builder()
                .flightId(1L)
                .cabId(10L)
                .cabPickupTime("12:00")
                .build();

        ItineraryRiskResponse response = assessmentService.assessItinerary(req);

        assertNotNull(response);
        assertTrue(response.getTransferBufferMinutes() < 0, "Buffer minutes should be negative indicating conflict");
        assertTrue(response.getTransferBufferAssessment().contains("Scheduling Conflict"), "Should flag scheduling conflict");
        assertTrue(response.getActionableMitigations().stream().anyMatch(m -> m.contains("Reschedule cab pickup")),
                "Should prompt immediate reschedule action");
    }

    @Test
    @DisplayName("Risk level classification properly buckets into LOW, MEDIUM, HIGH")
    void testRiskLevelThresholds() {
        assertEquals(RiskLevel.LOW, scoringEngine.classify(0.0));
        assertEquals(RiskLevel.LOW, scoringEngine.classify(15.0));
        assertEquals(RiskLevel.LOW, scoringEngine.classify(29.9));
        assertEquals(RiskLevel.MEDIUM, scoringEngine.classify(30.0));
        assertEquals(RiskLevel.MEDIUM, scoringEngine.classify(60.0));
        assertEquals(RiskLevel.HIGH, scoringEngine.classify(60.1));
        assertEquals(RiskLevel.HIGH, scoringEngine.classify(100.0));
    }
}
