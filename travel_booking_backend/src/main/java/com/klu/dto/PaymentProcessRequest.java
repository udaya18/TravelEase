package com.klu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentProcessRequest {

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    // Simulated outcome requested: SUCCESS, FAILURE, CANCELLED
    private String outcome = "SUCCESS";

    private String failureReason; // Optional custom failure reason for testing
}

