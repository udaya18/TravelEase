package com.klu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long paymentId;
    private String transactionReference;
    private Long bookingId;
    private String bookingReference;
    private Long userId;
    private double amount;
    private String currency;
    private String paymentMethod;
    private String paymentStatus;
    private String bookingStatus;
    private String failureReason;
    private boolean isDemo;
    private String simulatedProvider;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String message;
}

