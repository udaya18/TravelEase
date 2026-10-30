package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = {
    @Index(name = "idx_bookings_user_id", columnList = "userId"),
    @Index(name = "idx_bookings_reference", columnList = "bookingReference", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @Column(nullable = false, unique = true)
    private String bookingReference;

    // User who made the booking
    @Column(nullable = false)
    private Long userId;

    // Service IDs — nullable because not all services are always selected
    private Long flightId;
    private Long hotelId;
    private Long cabId;

    // Traveller details
    @Column(nullable = false)
    private String travellerName;

    @Column(nullable = false)
    private String travellerEmail;

    private String travellerPhone;

    @Column(nullable = false)
    private LocalDate travelDate;

    @Column(nullable = false)
    private double totalAmount;

    @Column(nullable = false)
    private String paymentMethod; // CARD, UPI, CASH, DEMO

    @Column(nullable = false)
    private String paymentStatus; // PENDING, PAID, FAILED

    @Column(nullable = false)
    private String bookingStatus; // PENDING, CONFIRMED, CANCELLED

    private String transactionReference; // Demo / simulated transaction reference

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
