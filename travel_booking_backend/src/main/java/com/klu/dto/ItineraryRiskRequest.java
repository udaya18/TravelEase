package com.klu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryRiskRequest {

    private Long flightId;
    private Long hotelId;
    private Long cabId;
    private String travelDate;
    private String cabPickupTime; // e.g. "12:15"
}
