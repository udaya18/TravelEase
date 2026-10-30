package com.klu.controller;

import com.klu.dto.*;
import com.klu.model.RankingCriteria;
import com.klu.model.RiskAssessment;
import com.klu.service.RiskAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@Tag(name = "Rule-Based Travel Risk Assessment", description = "Rule-based flight ranking, itinerary assessment, and travel risk scoring")
public class RiskController {

    private final RiskAssessmentService riskAssessmentService;

    @Operation(summary = "Rank flights with rule-based multi-criteria scoring")
    @GetMapping("/rank-flights")
    public ResponseEntity<List<RiskRankedFlightResponse>> rankFlights(
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String destination,
            @RequestParam(defaultValue = "BALANCED") RankingCriteria criteria
    ) {
        return ResponseEntity.ok(riskAssessmentService.rankFlights(source, destination, criteria));
    }

    @Operation(summary = "Get rule-based risk score and explanations for a single flight")
    @GetMapping("/flight/{flightId}")
    public ResponseEntity<RiskRankedFlightResponse> getFlightRisk(@PathVariable Long flightId) {
        return ResponseEntity.ok(riskAssessmentService.getRiskForFlight(flightId));
    }

    @Operation(summary = "Get rule-based risk score and explanations for a cab transfer")
    @GetMapping("/cab/{cabId}")
    public ResponseEntity<RiskRankedCabResponse> getCabRisk(@PathVariable Long cabId) {
        return ResponseEntity.ok(riskAssessmentService.getRiskForCab(cabId));
    }

    @Operation(summary = "Evaluate whole-trip itinerary connection risks and buffer margins using business rules")
    @PostMapping("/assess-itinerary")
    public ResponseEntity<ItineraryRiskResponse> assessItinerary(@RequestBody ItineraryRiskRequest request) {
        return ResponseEntity.ok(riskAssessmentService.assessItinerary(request));
    }

    @Operation(summary = "Get recent persisted rule-based risk assessments from PostgreSQL")
    @GetMapping("/history")
    public ResponseEntity<List<RiskAssessment>> getRecentAssessments() {
        return ResponseEntity.ok(riskAssessmentService.getRecentAssessments());
    }
}
