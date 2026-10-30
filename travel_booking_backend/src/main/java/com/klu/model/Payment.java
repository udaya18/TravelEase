package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_booking_id", columnList = "bookingId"),
    @Index(name = "idx_payments_user_id", columnList = "userId"),
    @Index(name = "idx_payments_tx_ref", columnList = "transactionReference", unique = true),
    @Index(name = "idx_payments_rzp_order", columnList = "razorpayOrderId"),
    @Index(name = "idx_payments_rzp_payment", columnList = "razorpayPaymentId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @Column(nullable = false, unique = true)
    private String transactionReference; // e.g. DEMO-TXN-2026-XXXXXX or RZP-TXN-XXXXXX

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private double amount;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(nullable = false)
    private String paymentMethod; // CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING, RAZORPAY, DEMO

    @Column(nullable = false)
    private String paymentStatus; // PENDING, DEMO_PAID, PAID, FAILED, CANCELLED, REFUNDED

    private String failureReason; // e.g. "SIMULATED_DECLINE", "USER_CANCELLED", "SIGNATURE_FAILED"

    @Column(nullable = false)
    private boolean isDemo = true; // Identifies test/demo transaction

    private String simulatedProvider; // e.g. "Razorpay Test Gateway"

    private String razorpayOrderId;

    private String razorpayPaymentId;

    private String razorpaySignature;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Payment(Long paymentId, String transactionReference, Long bookingId, Long userId,
                   double amount, String currency, String paymentMethod, String paymentStatus,
                   String failureReason, boolean isDemo, String simulatedProvider,
                   LocalDateTime createdAt, LocalDateTime completedAt) {
        this.paymentId = paymentId;
        this.transactionReference = transactionReference;
        this.bookingId = bookingId;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.failureReason = failureReason;
        this.isDemo = isDemo;
        this.simulatedProvider = simulatedProvider;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }
}

