package com.klu.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderRequest {

    @NotNull(message = "Booking ID is required to create a payment order")
    private Long bookingId;
}

