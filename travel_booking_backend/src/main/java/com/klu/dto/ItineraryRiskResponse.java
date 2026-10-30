package com.klu.dto;

import com.klu.model.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryRiskResponse {

    private double overallTripRiskScore; // 0 - 100 (lower is safer)
    private RiskLevel overallTripRiskLevel; // LOW, MEDIUM, HIGH
    private double compositeRecommendationScore; // 0 - 100
    private RiskScoreDetails flightRisk;
    private RiskScoreDetails cabRisk;
    private RiskScoreDetails hotelRisk;
    private double transferBufferMinutes; // Buffer minutes between flight arrival and cab pickup
    private String transferBufferAssessment; // e.g. "Safe Buffer (>45 mins)"
    private List<String> tripLevelExplanations;
    private List<String> actionableMitigations;
}
