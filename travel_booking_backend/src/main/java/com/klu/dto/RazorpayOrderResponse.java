package com.klu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponse {

    private String orderId;
    private Long amount; // in paise (e.g. 4850.00 -> 485000)
    private String currency; // INR
    private String keyId; // Public Razorpay Test Key ID
    private Long bookingId;
    private String bookingReference;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String description;
    private String notes;
}

