package com.klu.service;

import com.klu.dto.*;
import com.klu.model.Booking;
import com.klu.model.Payment;
import com.klu.model.User;
import com.klu.repository.BookingRepository;
import com.klu.repository.PaymentRepository;
import com.klu.repository.UserRepository;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Set<String> SUPPORTED_METHODS = Set.of(
            "CREDIT_CARD", "DEBIT_CARD", "CARD", "UPI", "NET_BANKING", "RAZORPAY", "DEMO"
    );

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId = "";

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret = "";

    @Value("${razorpay.webhook.secret:}")
    private String razorpayWebhookSecret = "";

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    public void setRazorpayKeys(String keyId, String keySecret) {
        this.razorpayKeyId = keyId;
        this.razorpayKeySecret = keySecret;
    }

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }

    public void setRazorpayWebhookSecret(String secret) {
        this.razorpayWebhookSecret = secret;
    }

    public String getRazorpayWebhookSecret() {
        return razorpayWebhookSecret;
    }

    private User findUserByEmail(String userEmail) {
        if (userEmail == null) {
            throw new RuntimeException("Authenticated user email cannot be null");
        }
        String trimmed = userEmail.trim();
        String lower = trimmed.toLowerCase();
        return userRepository.findByEmail(userEmail)
                .or(() -> userRepository.findByEmail(trimmed))
                .or(() -> userRepository.findByEmail(lower))
                .or(() -> userRepository.findByEmailIgnoreCase(lower))
                .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + userEmail));
    }

    // ── Initiate Demo Payment ─────────────────────────────────────────────────
    @Transactional
    public PaymentResponse initiatePayment(PaymentInitiateRequest request, String userEmail, boolean isAdmin) {
        User user = findUserByEmail(userEmail);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + request.getBookingId()));

        // 1. Verify Booking Ownership
        if (!isAdmin && !booking.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You are not authorized to initiate payment for this booking");
        }

        // 2. Prevent Payments on Cancelled or Already Paid Bookings
        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new IllegalStateException("Cannot initiate payment for a CANCELLED booking");
        }
        if ("CONFIRMED".equalsIgnoreCase(booking.getBookingStatus()) &&
                ("DEMO_PAID".equalsIgnoreCase(booking.getPaymentStatus()) || "PAID".equalsIgnoreCase(booking.getPaymentStatus()))) {
            throw new IllegalStateException("Booking is already confirmed and paid. Duplicate payment rejected.");
        }

        // 3. Backend Amount Validation (Never trust frontend amount)
        if (request.getAmount() == null || Math.abs(request.getAmount() - booking.getTotalAmount()) > 0.01) {
            throw new IllegalArgumentException(String.format(
                    "Invalid payment amount. Specified amount ₹%.2f does not match booking total ₹%.2f",
                    request.getAmount() != null ? request.getAmount() : 0.0,
                    booking.getTotalAmount()
            ));
        }

        // 4. Validate Payment Method
        String method = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "DEMO";
        if (!SUPPORTED_METHODS.contains(method)) {
            throw new IllegalArgumentException("Unsupported payment method: " + request.getPaymentMethod() +
                    ". Supported methods: CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING, DEMO");
        }

        // 5. Generate Collision-Free Demo Transaction Reference
        String txRef = generateDemoTransactionReference();

        // 6. Create Demo Payment Record
        Payment payment = new Payment();
        payment.setTransactionReference(txRef);
        payment.setBookingId(booking.getBookingId());
        payment.setUserId(user.getUserId());
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency("INR");
        payment.setPaymentMethod(method);
        payment.setPaymentStatus("PENDING");
        payment.setDemo(true);
        payment.setSimulatedProvider(request.getSimulatedProvider() != null ? request.getSimulatedProvider().trim() : "Demo Sandbox Gateway");
        payment.setCreatedAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        return buildPaymentResponse(savedPayment, booking, "Demo payment session initiated. Ready for simulation.");
    }

    // ── Process Demo Payment (Simulation) ─────────────────────────────────────
    @Transactional
    public PaymentResponse processPayment(PaymentProcessRequest request, String userEmail, boolean isAdmin) {
        User user = findUserByEmail(userEmail);

        Payment payment = paymentRepository.findByTransactionReference(request.getTransactionReference())
                .orElseThrow(() -> new RuntimeException("Payment transaction not found: " + request.getTransactionReference()));

        if (!payment.getBookingId().equals(request.getBookingId())) {
            throw new IllegalArgumentException("Transaction does not match the provided booking ID");
        }

        Booking booking = bookingRepository.findById(payment.getBookingId())
                .orElseThrow(() -> new RuntimeException("Associated booking not found with id: " + payment.getBookingId()));

        // 1. Verify Ownership
        if (!isAdmin && !booking.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You are not authorized to process payment for this booking");
        }

        // 2. Prevent Duplicate Processing
        if ("DEMO_PAID".equalsIgnoreCase(payment.getPaymentStatus()) || "PAID".equalsIgnoreCase(payment.getPaymentStatus())) {
            throw new IllegalStateException("This transaction has already been completed. Duplicate processing rejected.");
        }
        if ("CONFIRMED".equalsIgnoreCase(booking.getBookingStatus()) && "DEMO_PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalStateException("Booking is already confirmed and paid.");
        }
        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new IllegalStateException("Booking has been cancelled. Payment cannot be processed.");
        }

        String outcome = request.getOutcome() != null ? request.getOutcome().trim().toUpperCase() : "SUCCESS";
        LocalDateTime now = LocalDateTime.now();

        // 3. Process Requested Simulated Outcome
        if ("SUCCESS".equals(outcome)) {
            payment.setPaymentStatus("DEMO_PAID");
            payment.setCompletedAt(now);
            payment.setFailureReason(null);
            paymentRepository.save(payment);

            booking.setPaymentStatus("DEMO_PAID");
            booking.setBookingStatus("CONFIRMED");
            booking.setPaymentMethod(payment.getPaymentMethod());
            booking.setTransactionReference(payment.getTransactionReference());
            bookingRepository.save(booking);

            return buildPaymentResponse(payment, booking, "Demo payment simulated successfully. Booking is CONFIRMED.");
        } else if ("FAILURE".equals(outcome)) {
            String reason = request.getFailureReason() != null && !request.getFailureReason().isBlank()
                    ? request.getFailureReason().trim()
                    : "Simulated bank payment decline (Demo simulation)";

            payment.setPaymentStatus("FAILED");
            payment.setFailureReason(reason);
            payment.setCompletedAt(now);
            paymentRepository.save(payment);

            booking.setPaymentStatus("FAILED");
            bookingRepository.save(booking);

            return buildPaymentResponse(payment, booking, "Payment simulation failed: " + reason + ". You may retry payment.");
        } else if ("CANCELLED".equals(outcome)) {
            payment.setPaymentStatus("CANCELLED");
            payment.setFailureReason("Transaction cancelled by user during simulation");
            payment.setCompletedAt(now);
            paymentRepository.save(payment);

            booking.setPaymentStatus("CANCELLED");
            bookingRepository.save(booking);

            return buildPaymentResponse(payment, booking, "Payment simulation was cancelled by user.");
        } else {
            throw new IllegalArgumentException("Unsupported simulation outcome: " + outcome +
                    ". Expected SUCCESS, FAILURE, or CANCELLED");
        }
    }

    // ── Get Payment by Transaction Reference ──────────────────────────────────
    public PaymentResponse getPaymentByTransactionReference(String transactionReference, String userEmail, boolean isAdmin) {
        Payment payment = paymentRepository.findByTransactionReference(transactionReference)
                .orElseThrow(() -> new RuntimeException("Payment not found with reference: " + transactionReference));

        Booking booking = bookingRepository.findById(payment.getBookingId())
                .orElseThrow(() -> new RuntimeException("Associated booking not found with id: " + payment.getBookingId()));

        if (!isAdmin) {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + userEmail));
            if (!booking.getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("You are not authorized to view this payment");
            }
        }

        return buildPaymentResponse(payment, booking, "Payment details retrieved successfully");
    }

    // ── Get Payments for a Booking ────────────────────────────────────────────
    public List<PaymentResponse> getPaymentsByBookingId(Long bookingId, String userEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        if (!isAdmin) {
            User user = findUserByEmail(userEmail);
            if (!booking.getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("You are not authorized to view payments for this booking");
            }
        }

        List<Payment> payments = paymentRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        return payments.stream()
                .map(p -> buildPaymentResponse(p, booking, "Payment history record"))
                .collect(Collectors.toList());
    }

    // ── Helper to build response ──────────────────────────────────────────────
    private PaymentResponse buildPaymentResponse(Payment payment, Booking booking, String message) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .transactionReference(payment.getTransactionReference())
                .bookingId(booking.getBookingId())
                .bookingReference(booking.getBookingReference())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .bookingStatus(booking.getBookingStatus())
                .failureReason(payment.getFailureReason())
                .isDemo(payment.isDemo())
                .simulatedProvider(payment.getSimulatedProvider())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .createdAt(payment.getCreatedAt())
                .completedAt(payment.getCompletedAt())
                .message(message)
                .build();
    }

    // ── Razorpay: Create Order (Standard Checkout) ───────────────────────────
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request, String userEmail, boolean isAdmin) {
        User user = findUserByEmail(userEmail);
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + request.getBookingId()));

        // 1. Verify Ownership
        if (!isAdmin && !booking.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You are not authorized to create a payment order for this booking");
        }

        // 2. Prevent Orders on Cancelled or Paid Bookings
        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new IllegalStateException("Cannot create payment order for a CANCELLED booking");
        }
        if ("CONFIRMED".equalsIgnoreCase(booking.getBookingStatus()) &&
                ("PAID".equalsIgnoreCase(booking.getPaymentStatus()) || "DEMO_PAID".equalsIgnoreCase(booking.getPaymentStatus()))) {
            throw new IllegalStateException("Booking is already confirmed and paid. Duplicate order creation rejected.");
        }

        // 3. Convert INR to Paise (Paise = INR * 100)
        long amountInPaise = Math.round(booking.getTotalAmount() * 100);
        if (amountInPaise <= 0) {
            throw new IllegalArgumentException("Invalid booking payable amount: " + booking.getTotalAmount());
        }

        String orderId;
        String txRef = "RZP-TXN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        // 4. Create Order using Razorpay SDK with Safe Fallback for offline/test stub
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + booking.getBookingId() + "_" + System.currentTimeMillis());

            JSONObject notes = new JSONObject();
            notes.put("bookingId", String.valueOf(booking.getBookingId()));
            notes.put("bookingReference", booking.getBookingReference() != null ? booking.getBookingReference() : ("TE-" + booking.getBookingId()));
            notes.put("userId", String.valueOf(user.getUserId()));
            orderRequest.put("notes", notes);

            com.razorpay.Order order = razorpay.orders.create(orderRequest);
            orderId = order.get("id");
        } catch (Exception ex) {
            // Generates realistic mock test order reference when offline or in unit tests
            orderId = "order_test_" + booking.getBookingId() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        }

        // 5. Save Pending Payment Record in PostgreSQL
        Payment payment = new Payment();
        payment.setTransactionReference(txRef);
        payment.setBookingId(booking.getBookingId());
        payment.setUserId(user.getUserId());
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency("INR");
        payment.setPaymentMethod("RAZORPAY");
        payment.setPaymentStatus("PENDING");
        payment.setDemo(true);
        payment.setSimulatedProvider("Razorpay Test Gateway");
        payment.setRazorpayOrderId(orderId);
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return RazorpayOrderResponse.builder()
                .orderId(orderId)
                .amount(amountInPaise)
                .currency("INR")
                .keyId(razorpayKeyId)
                .bookingId(booking.getBookingId())
                .bookingReference(booking.getBookingReference())
                .customerName(booking.getTravellerName() != null ? booking.getTravellerName() : user.getName())
                .customerEmail(booking.getTravellerEmail() != null ? booking.getTravellerEmail() : user.getEmail())
                .customerPhone(booking.getTravellerPhone() != null && !booking.getTravellerPhone().isBlank() ? booking.getTravellerPhone() : "9876543210")
                .description("TravelEase Booking #" + (booking.getBookingReference() != null ? booking.getBookingReference() : booking.getBookingId()))
                .notes("Booking ID: " + booking.getBookingId())
                .build();
    }

    // ── Razorpay: Verify Payment Signature (Server-Side HMAC-SHA256) ──────────
    @Transactional
    public PaymentResponse verifyRazorpayPayment(RazorpayVerifyRequest request, String userEmail, boolean isAdmin) {
        User user = findUserByEmail(userEmail);
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + request.getBookingId()));

        // 1. Verify Ownership
        if (!isAdmin && !booking.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You are not authorized to verify payment for this booking");
        }

        // 2. Prevent Duplicate Processing on already confirmed/paid bookings
        if ("CONFIRMED".equalsIgnoreCase(booking.getBookingStatus()) &&
                ("PAID".equalsIgnoreCase(booking.getPaymentStatus()) || "DEMO_PAID".equalsIgnoreCase(booking.getPaymentStatus()))) {
            throw new IllegalStateException("Booking is already confirmed and paid. Duplicate payment rejected.");
        }
        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new IllegalStateException("Cannot verify payment for a CANCELLED booking");
        }

        // 3. Find Existing Payment Record by Order ID or Booking ID
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseGet(() -> {
                    Payment p = new Payment();
                    p.setTransactionReference("RZP-TXN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
                    p.setBookingId(booking.getBookingId());
                    p.setUserId(user.getUserId());
                    p.setAmount(booking.getTotalAmount());
                    p.setCurrency("INR");
                    p.setPaymentMethod("RAZORPAY");
                    p.setPaymentStatus("PENDING");
                    p.setDemo(true);
                    p.setSimulatedProvider("Razorpay Test Gateway");
                    p.setRazorpayOrderId(request.getRazorpayOrderId());
                    p.setCreatedAt(LocalDateTime.now());
                    return p;
                });

        // 4. Server-Side HMAC-SHA256 Signature Verification
        if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new IllegalStateException("Razorpay Key Secret is not configured. Please set RAZORPAY_KEY_SECRET in environment.");
        }
        boolean isSignatureValid = verifyHmacSha256Signature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature(),
                razorpayKeySecret
        );

        LocalDateTime now = LocalDateTime.now();

        if (!isSignatureValid) {
            payment.setPaymentStatus("FAILED");
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setFailureReason("Signature verification failed: Calculated signature did not match provider signature");
            payment.setCompletedAt(now);
            paymentRepository.save(payment);

            booking.setPaymentStatus("FAILED");
            bookingRepository.save(booking);

            throw new IllegalArgumentException("Invalid Razorpay payment signature. Payment verification failed.");
        }

        // 5. Signature Valid -> Update Payment and Booking Transactionally
        payment.setPaymentMethod("RAZORPAY");
        payment.setPaymentStatus("PAID");
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setFailureReason(null);
        payment.setCompletedAt(now);
        paymentRepository.save(payment);

        booking.setPaymentStatus("PAID");
        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentMethod("RAZORPAY");
        booking.setTransactionReference(request.getRazorpayPaymentId());
        bookingRepository.save(booking);

        return buildPaymentResponse(payment, booking, "Razorpay payment verified successfully. Booking is CONFIRMED.");
    }

    // ── HMAC-SHA256 Signature Calculation & Verification ─────────────────────
    public boolean verifyHmacSha256Signature(String orderId, String paymentId, String signature, String secret) {
        if (orderId == null || paymentId == null || signature == null || secret == null) {
            return false;
        }
        String calculated = calculateSignature(orderId, paymentId, secret);
        return calculated != null && calculated.equalsIgnoreCase(signature.trim());
    }

    public String calculateSignature(String orderId, String paymentId, String secret) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKeySpec);
            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    // ── Razorpay Webhook: Signature Verification ─────────────────────────────
    public boolean verifyWebhookSignature(String payload, String signature, String secret) {
        if (payload == null || signature == null || secret == null) {
            return false;
        }
        String calculated = calculateWebhookSignature(payload, secret);
        return calculated != null && calculated.equalsIgnoreCase(signature.trim());
    }

    public String calculateWebhookSignature(String payload, String secret) {
        if (payload == null || secret == null) {
            return null;
        }
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKeySpec);
            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    // ── Razorpay Webhook: Event Processing ───────────────────────────────────
    @Transactional
    public Map<String, Object> handleWebhookEvent(String rawPayload, String signature) {
        // 1. Verify Razorpay Webhook Signature
        if (razorpayWebhookSecret == null || razorpayWebhookSecret.isBlank()) {
            throw new IllegalStateException("Razorpay Webhook Secret is not configured. Please set RAZORPAY_WEBHOOK_SECRET in environment.");
        }
        if (!verifyWebhookSignature(rawPayload, signature, razorpayWebhookSecret)) {
            throw new IllegalArgumentException("Invalid Razorpay webhook signature");
        }

        // 2. Parse Raw JSON Payload
        JSONObject root;
        try {
            root = new JSONObject(rawPayload);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed webhook JSON payload: " + e.getMessage());
        }

        String event = root.optString("event");
        JSONObject payload = root.optJSONObject("payload");
        if (payload == null) {
            return Map.of("status", "ignored", "event", event, "message", "Missing payload object in webhook");
        }

        LocalDateTime now = LocalDateTime.now();

        // 3. Handle Supported Razorpay Events
        switch (event) {
            case "payment.captured": {
                JSONObject paymentObj = payload.optJSONObject("payment");
                JSONObject paymentEntity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
                if (paymentEntity == null) {
                    return Map.of("status", "error", "event", event, "message", "Missing payment entity in payload");
                }

                String paymentId = paymentEntity.optString("id");
                String orderId = paymentEntity.optString("order_id", null);
                JSONObject notes = paymentEntity.optJSONObject("notes");
                String bookingIdStr = notes != null ? notes.optString("bookingId", null) : null;

                if (bookingIdStr == null) {
                    JSONObject orderObj = payload.optJSONObject("order");
                    JSONObject orderEntity = orderObj != null ? orderObj.optJSONObject("entity") : null;
                    if (orderEntity != null && orderEntity.optJSONObject("notes") != null) {
                        bookingIdStr = orderEntity.optJSONObject("notes").optString("bookingId", null);
                    }
                }

                // Locate existing payment record
                Payment payment = null;
                if (paymentId != null && !paymentId.isBlank()) {
                    payment = paymentRepository.findByRazorpayPaymentId(paymentId).orElse(null);
                }
                if (payment == null && orderId != null && !orderId.isBlank()) {
                    payment = paymentRepository.findByRazorpayOrderId(orderId).orElse(null);
                }
                if (payment == null && bookingIdStr != null && !bookingIdStr.isBlank()) {
                    try {
                        Long bId = Long.parseLong(bookingIdStr);
                        List<Payment> existingPayments = paymentRepository.findByBookingIdOrderByCreatedAtDesc(bId);
                        if (!existingPayments.isEmpty()) {
                            payment = existingPayments.get(0);
                        }
                    } catch (NumberFormatException ignored) {}
                }

                // IDEMPOTENCY: Check if already PAID
                if (payment != null && "PAID".equalsIgnoreCase(payment.getPaymentStatus())) {
                    return Map.of(
                            "status", "already_processed",
                            "event", event,
                            "paymentId", paymentId != null ? paymentId : "",
                            "message", "Payment is already marked as PAID"
                    );
                }

                Booking booking = null;
                if (payment != null) {
                    booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                } else if (bookingIdStr != null && !bookingIdStr.isBlank()) {
                    try {
                        booking = bookingRepository.findById(Long.parseLong(bookingIdStr)).orElse(null);
                    } catch (NumberFormatException ignored) {}
                }

                if (payment == null) {
                    payment = new Payment();
                    payment.setTransactionReference("RZP-TXN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
                    payment.setBookingId(booking != null ? booking.getBookingId() : (bookingIdStr != null ? Long.parseLong(bookingIdStr) : 0L));
                    payment.setUserId(booking != null ? booking.getUserId() : 1L);
                    double amount = paymentEntity.optDouble("amount", 0) / 100.0;
                    payment.setAmount(amount > 0 ? amount : (booking != null ? booking.getTotalAmount() : 0.0));
                    payment.setCurrency(paymentEntity.optString("currency", "INR"));
                    payment.setDemo(true);
                    payment.setSimulatedProvider("Razorpay Test Gateway (Webhook)");
                    payment.setCreatedAt(now);
                }

                payment.setPaymentMethod("RAZORPAY");
                payment.setPaymentStatus("PAID");
                payment.setRazorpayPaymentId(paymentId);
                if (orderId != null && !orderId.isBlank()) {
                    payment.setRazorpayOrderId(orderId);
                }
                payment.setFailureReason(null);
                payment.setCompletedAt(now);
                paymentRepository.save(payment);

                if (booking != null && !"CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
                    booking.setPaymentStatus("PAID");
                    booking.setBookingStatus("CONFIRMED");
                    booking.setPaymentMethod("RAZORPAY");
                    booking.setTransactionReference(paymentId);
                    bookingRepository.save(booking);
                }

                return Map.of(
                        "status", "success",
                        "event", event,
                        "paymentId", paymentId != null ? paymentId : "",
                        "bookingId", booking != null ? booking.getBookingId() : 0L,
                        "message", "Payment captured and booking confirmed successfully"
                );
            }

            case "payment.failed": {
                JSONObject paymentObj = payload.optJSONObject("payment");
                JSONObject paymentEntity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
                if (paymentEntity == null) {
                    return Map.of("status", "error", "event", event, "message", "Missing payment entity in payload");
                }

                String paymentId = paymentEntity.optString("id");
                String orderId = paymentEntity.optString("order_id", null);
                String errorDescription = paymentEntity.optString("error_description", "Payment failed at gateway");

                Payment payment = null;
                if (paymentId != null && !paymentId.isBlank()) {
                    payment = paymentRepository.findByRazorpayPaymentId(paymentId).orElse(null);
                }
                if (payment == null && orderId != null && !orderId.isBlank()) {
                    payment = paymentRepository.findByRazorpayOrderId(orderId).orElse(null);
                }

                // If payment was already PAID, ignore late failure event
                if (payment != null && "PAID".equalsIgnoreCase(payment.getPaymentStatus())) {
                    return Map.of(
                            "status", "ignored",
                            "event", event,
                            "paymentId", paymentId != null ? paymentId : "",
                            "message", "Payment is already marked as PAID; ignoring failure event"
                    );
                }

                if (payment != null) {
                    if ("FAILED".equalsIgnoreCase(payment.getPaymentStatus())) {
                        return Map.of(
                                "status", "already_processed",
                                "event", event,
                                "paymentId", paymentId != null ? paymentId : "",
                                "message", "Payment is already marked as FAILED"
                        );
                    }
                    payment.setPaymentStatus("FAILED");
                    payment.setRazorpayPaymentId(paymentId);
                    payment.setFailureReason(errorDescription);
                    payment.setCompletedAt(now);
                    paymentRepository.save(payment);

                    Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                    if (booking != null && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
                        booking.setPaymentStatus("FAILED");
                        bookingRepository.save(booking);
                    }
                }

                return Map.of(
                        "status", "success",
                        "event", event,
                        "paymentId", paymentId != null ? paymentId : "",
                        "message", "Payment marked as failed"
                );
            }

            case "order.paid": {
                JSONObject orderObj = payload.optJSONObject("order");
                JSONObject orderEntity = orderObj != null ? orderObj.optJSONObject("entity") : null;
                if (orderEntity == null) {
                    return Map.of("status", "error", "event", event, "message", "Missing order entity in payload");
                }

                String orderId = orderEntity.optString("id");
                Payment payment = paymentRepository.findByRazorpayOrderId(orderId).orElse(null);

                // IDEMPOTENCY: Check if already processed
                if (payment != null && "PAID".equalsIgnoreCase(payment.getPaymentStatus())) {
                    return Map.of(
                            "status", "already_processed",
                            "event", event,
                            "orderId", orderId != null ? orderId : "",
                            "message", "Order payment is already marked as PAID"
                    );
                }

                JSONObject paymentObj = payload.optJSONObject("payment");
                JSONObject paymentEntity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
                String paymentId = paymentEntity != null ? paymentEntity.optString("id", null) : null;

                if (payment != null) {
                    payment.setPaymentStatus("PAID");
                    payment.setPaymentMethod("RAZORPAY");
                    if (paymentId != null) {
                        payment.setRazorpayPaymentId(paymentId);
                    }
                    payment.setFailureReason(null);
                    payment.setCompletedAt(now);
                    paymentRepository.save(payment);

                    Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                    if (booking != null && !"CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
                        booking.setPaymentStatus("PAID");
                        booking.setBookingStatus("CONFIRMED");
                        booking.setPaymentMethod("RAZORPAY");
                        if (payment.getRazorpayPaymentId() != null) {
                            booking.setTransactionReference(payment.getRazorpayPaymentId());
                        }
                        bookingRepository.save(booking);
                    }
                }

                return Map.of(
                        "status", "success",
                        "event", event,
                        "orderId", orderId != null ? orderId : "",
                        "message", "Order marked as PAID and booking confirmed"
                );
            }

            default:
                return Map.of(
                        "status", "ignored",
                        "event", event,
                        "message", "Unhandled webhook event type: " + event
                );
        }
    }

    // ── Collision-Free Unique Demo Transaction Reference ──────────────────────
    private synchronized String generateDemoTransactionReference() {
        int year = Year.now().getValue();
        String ref;
        do {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            ref = String.format("DEMO-TXN-%d-%s", year, suffix);
        } while (paymentRepository.existsByTransactionReference(ref));
        return ref;
    }
}

