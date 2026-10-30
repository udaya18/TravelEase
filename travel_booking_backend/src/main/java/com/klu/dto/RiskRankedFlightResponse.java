package com.klu.dto;

import com.klu.model.Flight;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskRankedFlightResponse {

    private Flight flight;
    private RiskScoreDetails riskDetails;
}
