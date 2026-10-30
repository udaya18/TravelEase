package com.klu.controller;

import com.klu.dto.*;
import com.klu.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Razorpay Standard Checkout & Payment APIs")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(summary = "Create a Razorpay order in test mode for a booking")
    @PostMapping("/create-order")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(
            @Valid @RequestBody RazorpayOrderRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createRazorpayOrder(request, email, isAdmin));
    }

    @Operation(summary = "Verify Razorpay payment signature and confirm booking")
    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(
            @Valid @RequestBody RazorpayVerifyRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paymentService.verifyRazorpayPayment(request, email, isAdmin));
    }

    @Operation(summary = "Razorpay webhook endpoint for server-to-server event notifications")
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String rawPayload) {
        if (signature == null || signature.isBlank()) {
            throw new IllegalArgumentException("Missing required X-Razorpay-Signature header");
        }
        return ResponseEntity.ok(paymentService.handleWebhookEvent(rawPayload, signature));
    }

    @Operation(summary = "Initiate a demo payment session for a booking")
    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiatePayment(
            @Valid @RequestBody PaymentInitiateRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.initiatePayment(request, email, isAdmin));
    }

    @Operation(summary = "Process/simulate payment authorization outcome (SUCCESS, FAILURE, CANCELLED)")
    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(
            @Valid @RequestBody PaymentProcessRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paymentService.processPayment(request, email, isAdmin));
    }

    @Operation(summary = "Get payment transaction details by transaction reference")
    @GetMapping("/{transactionReference}")
    public ResponseEntity<PaymentResponse> getPaymentByTransactionReference(
            @PathVariable String transactionReference,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paymentService.getPaymentByTransactionReference(transactionReference, email, isAdmin));
    }

    @Operation(summary = "Get all payment attempts for a booking")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByBookingId(
            @PathVariable Long bookingId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paymentService.getPaymentsByBookingId(bookingId, email, isAdmin));
    }
}

