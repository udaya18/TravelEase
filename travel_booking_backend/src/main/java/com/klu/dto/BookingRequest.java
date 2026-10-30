package com.klu.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {

    private Long userId; // Will be set/verified from authenticated user
    private Long flightId;   // nullable
    private Long hotelId;    // nullable
    private Long cabId;      // nullable

    @NotBlank(message = "Traveller name is required")
    private String travellerName;

    @NotBlank(message = "Traveller email is required")
    @Email(message = "Valid traveller email is required")
    private String travellerEmail;

    private String travellerPhone;

    @NotNull(message = "Travel date is required")
    private LocalDate travelDate;

    private String paymentMethod; // CARD, UPI, DEMO
}
