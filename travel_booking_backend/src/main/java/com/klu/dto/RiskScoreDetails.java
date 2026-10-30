package com.klu.dto;

import com.klu.model.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskScoreDetails {

    private double riskScore; // 0.0 to 100.0 (lower is safer)
    private RiskLevel riskLevel; // LOW, MEDIUM, HIGH
    private double disruptionRisk; // Disruption probability (0 - 100%)
    private double transferRisk; // Transfer / connection hazard (0 - 100%)
    private double punctualityScore; // On-time expectation (0 - 100%)
    private double priceScore; // Normalized cost score (0 - 100)
    private double durationScore; // Normalized speed score (0 - 100)
    private double recommendationScore; // Overall composite recommendation (0 - 100)
    private int rank; // 1, 2, 3...
    private List<String> explanations; // Clear transparent reasons
    private Map<String, Object> telemetry; // Historical on-time rate, peak hour, congestion index
}
