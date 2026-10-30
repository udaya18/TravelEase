package com.klu.repository;

import com.klu.model.RiskAssessment;
import com.klu.model.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    List<RiskAssessment> findByOptionTypeOrderByAssessedAtDesc(String optionType);

    Optional<RiskAssessment> findTopByOptionTypeAndOptionIdOrderByAssessedAtDesc(String optionType, Long optionId);

    List<RiskAssessment> findByRiskLevel(RiskLevel riskLevel);

    List<RiskAssessment> findTop10ByOrderByAssessedAtDesc();
}
