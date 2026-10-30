package com.klu.dto;

import com.klu.model.Cab;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskRankedCabResponse {

    private Cab cab;
    private RiskScoreDetails riskDetails;
}
