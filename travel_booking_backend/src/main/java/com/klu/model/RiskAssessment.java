package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "risk_assessments", indexes = {
    @Index(name = "idx_risk_option", columnList = "optionType, optionId"),
    @Index(name = "idx_risk_level", columnList = "riskLevel")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String optionType; // FLIGHT, CAB, HOTEL, ITINERARY

    @Column(nullable = false)
    private Long optionId;

    @Column(nullable = false)
    private double riskScore; // 0.0 to 100.0 (lower is safer)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel; // LOW, MEDIUM, HIGH

    private double disruptionRisk; // Disruption probability 0 - 100%

    private double transferRisk; // Transfer / connection hazard 0 - 100%

    private double priceScore; // Normalized cost score 0 - 100

    private double durationScore; // Normalized speed score 0 - 100

    private double recommendationScore; // Composite rank score 0 - 100 (higher is better)

    private int rankPosition;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "risk_assessment_explanations", joinColumns = @JoinColumn(name = "assessment_id"))
    @Column(name = "explanation", length = 500)
    @Builder.Default
    private List<String> explanations = new ArrayList<>();

    @Column(length = 1000)
    private String telemetryJson;

    @Column(nullable = false)
    private LocalDateTime assessedAt;

    @PrePersist
    protected void onCreate() {
        if (assessedAt == null) {
            assessedAt = LocalDateTime.now();
        }
    }
}
