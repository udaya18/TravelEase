package com.klu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentInitiateRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING, DEMO

    @NotNull(message = "Amount is required")
    private Double amount;

    private String simulatedProvider; // e.g. "HDFC Bank", "GPay / UPI", "Visa Demo Sandbox"
}

