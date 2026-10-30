package com.klu;

import com.klu.dto.*;
import com.klu.model.Booking;
import com.klu.model.Payment;
import com.klu.model.Role;
import com.klu.model.User;
import com.klu.repository.BookingRepository;
import com.klu.repository.PaymentRepository;
import com.klu.repository.UserRepository;
import com.klu.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private User otherUser;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User(1L, "Rahul Verma", "rahul@example.com", "pass123", Role.USER);
        otherUser = new User(2L, "Sneha Patel", "sneha@example.com", "pass456", Role.USER);

        testBooking = new Booking();
        testBooking.setBookingId(100L);
        testBooking.setBookingReference("TE-2026-X8Y9Z1A");
        testBooking.setUserId(1L);
        testBooking.setFlightId(10L);
        testBooking.setTravellerName("Rahul Verma");
        testBooking.setTravellerEmail("rahul@example.com");
        testBooking.setTravelDate(LocalDate.now().plusDays(5));
        testBooking.setTotalAmount(5000.0);
        testBooking.setPaymentMethod("CREDIT_CARD");
        testBooking.setPaymentStatus("PENDING");
        testBooking.setBookingStatus("PENDING");

        paymentService.setRazorpayKeys("test_key_id", "test_key_secret");
        paymentService.setRazorpayWebhookSecret("test_webhook_secret");
    }

    @Test
    void testInitiatePayment_Success() {
        PaymentInitiateRequest request = new PaymentInitiateRequest();
        request.setBookingId(100L);
        request.setPaymentMethod("CREDIT_CARD");
        request.setAmount(5000.0);
        request.setSimulatedProvider("Visa Demo Gateway");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.existsByTransactionReference(anyString())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setPaymentId(50L);
            return p;
        });

        PaymentResponse response = paymentService.initiatePayment(request, "rahul@example.com", false);

        assertNotNull(response);
        assertEquals("PENDING", response.getPaymentStatus());
        assertTrue(response.isDemo());
        assertTrue(response.getTransactionReference().startsWith("DEMO-TXN-"));
        assertEquals(5000.0, response.getAmount());
        assertEquals("CREDIT_CARD", response.getPaymentMethod());
        assertEquals(100L, response.getBookingId());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void testInitiatePayment_UnauthorizedAccess_Throws() {
        PaymentInitiateRequest request = new PaymentInitiateRequest();
        request.setBookingId(100L);
        request.setPaymentMethod("UPI");
        request.setAmount(5000.0);

        when(userRepository.findByEmail("sneha@example.com")).thenReturn(Optional.of(otherUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        assertThrows(AccessDeniedException.class, () -> {
            paymentService.initiatePayment(request, "sneha@example.com", false);
        });

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void testInitiatePayment_IncorrectAmount_Throws() {
        PaymentInitiateRequest request = new PaymentInitiateRequest();
        request.setBookingId(100L);
        request.setPaymentMethod("UPI");
        request.setAmount(3000.0); // Mismatched amount!

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            paymentService.initiatePayment(request, "rahul@example.com", false);
        });

        assertTrue(ex.getMessage().contains("does not match booking total"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void testInitiatePayment_AlreadyConfirmedBooking_ThrowsDuplicateError() {
        testBooking.setBookingStatus("CONFIRMED");
        testBooking.setPaymentStatus("DEMO_PAID");

        PaymentInitiateRequest request = new PaymentInitiateRequest();
        request.setBookingId(100L);
        request.setPaymentMethod("CREDIT_CARD");
        request.setAmount(5000.0);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            paymentService.initiatePayment(request, "rahul@example.com", false);
        });

        assertTrue(ex.getMessage().contains("already confirmed and paid"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void testProcessPayment_Success_ConfirmsBooking() {
        Payment payment = new Payment(50L, "DEMO-TXN-2026-TEST1234", 100L, 1L, 5000.0, "INR", "UPI", "PENDING", null, true, "GPay", LocalDateTime.now(), null);

        PaymentProcessRequest request = new PaymentProcessRequest();
        request.setBookingId(100L);
        request.setTransactionReference("DEMO-TXN-2026-TEST1234");
        request.setOutcome("SUCCESS");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(paymentRepository.findByTransactionReference("DEMO-TXN-2026-TEST1234")).thenReturn(Optional.of(payment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request, "rahul@example.com", false);

        assertEquals("DEMO_PAID", response.getPaymentStatus());
        assertEquals("CONFIRMED", response.getBookingStatus());
        assertEquals("DEMO-TXN-2026-TEST1234", testBooking.getTransactionReference());
        assertEquals("DEMO_PAID", testBooking.getPaymentStatus());
        assertEquals("CONFIRMED", testBooking.getBookingStatus());
        assertNotNull(payment.getCompletedAt());

        verify(paymentRepository).save(payment);
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void testProcessPayment_Failure_MarksPaymentFailed() {
        Payment payment = new Payment(50L, "DEMO-TXN-2026-FAIL1234", 100L, 1L, 5000.0, "INR", "DEBIT_CARD", "PENDING", null, true, "SBI", LocalDateTime.now(), null);

        PaymentProcessRequest request = new PaymentProcessRequest();
        request.setBookingId(100L);
        request.setTransactionReference("DEMO-TXN-2026-FAIL1234");
        request.setOutcome("FAILURE");
        request.setFailureReason("Insufficient simulated balance");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(paymentRepository.findByTransactionReference("DEMO-TXN-2026-FAIL1234")).thenReturn(Optional.of(payment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request, "rahul@example.com", false);

        assertEquals("FAILED", response.getPaymentStatus());
        assertEquals("FAILED", testBooking.getPaymentStatus());
        assertEquals("Insufficient simulated balance", payment.getFailureReason());
        verify(paymentRepository).save(payment);
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void testProcessPayment_Cancelled_MarksPaymentCancelled() {
        Payment payment = new Payment(50L, "DEMO-TXN-2026-CANC1234", 100L, 1L, 5000.0, "INR", "NET_BANKING", "PENDING", null, true, "HDFC", LocalDateTime.now(), null);

        PaymentProcessRequest request = new PaymentProcessRequest();
        request.setBookingId(100L);
        request.setTransactionReference("DEMO-TXN-2026-CANC1234");
        request.setOutcome("CANCELLED");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(paymentRepository.findByTransactionReference("DEMO-TXN-2026-CANC1234")).thenReturn(Optional.of(payment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request, "rahul@example.com", false);

        assertEquals("CANCELLED", response.getPaymentStatus());
        assertEquals("CANCELLED", testBooking.getPaymentStatus());
        verify(paymentRepository).save(payment);
        verify(bookingRepository).save(testBooking);
    }

    @Test
    void testProcessPayment_DuplicateAttempt_Throws() {
        Payment alreadyPaid = new Payment(50L, "DEMO-TXN-2026-DUP1234", 100L, 1L, 5000.0, "INR", "CREDIT_CARD", "DEMO_PAID", null, true, "Visa", LocalDateTime.now(), LocalDateTime.now());

        PaymentProcessRequest request = new PaymentProcessRequest();
        request.setBookingId(100L);
        request.setTransactionReference("DEMO-TXN-2026-DUP1234");
        request.setOutcome("SUCCESS");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(paymentRepository.findByTransactionReference("DEMO-TXN-2026-DUP1234")).thenReturn(Optional.of(alreadyPaid));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        assertThrows(IllegalStateException.class, () -> {
            paymentService.processPayment(request, "rahul@example.com", false);
        });
    }

    @Test
    void testRetryPayment_AfterFailure_Success() {
        // 1. Initial attempt failed
        Payment failedPayment = new Payment(51L, "DEMO-TXN-2026-FIRST", 100L, 1L, 5000.0, "INR", "CREDIT_CARD", "FAILED", "Card declined", true, "Visa", LocalDateTime.now(), LocalDateTime.now());
        testBooking.setPaymentStatus("FAILED");

        // 2. Initiate retry with UPI
        PaymentInitiateRequest retryRequest = new PaymentInitiateRequest();
        retryRequest.setBookingId(100L);
        retryRequest.setPaymentMethod("UPI");
        retryRequest.setAmount(5000.0);
        retryRequest.setSimulatedProvider("Paytm UPI");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.existsByTransactionReference(anyString())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setPaymentId(52L);
            return p;
        });

        PaymentResponse retryResponse = paymentService.initiatePayment(retryRequest, "rahul@example.com", false);
        assertNotNull(retryResponse);
        assertEquals("PENDING", retryResponse.getPaymentStatus());
        assertEquals("UPI", retryResponse.getPaymentMethod());

        // 3. Process retry with SUCCESS
        Payment newPayment = new Payment(52L, retryResponse.getTransactionReference(), 100L, 1L, 5000.0, "INR", "UPI", "PENDING", null, true, "Paytm UPI", LocalDateTime.now(), null);
        PaymentProcessRequest processRequest = new PaymentProcessRequest();
        processRequest.setBookingId(100L);
        processRequest.setTransactionReference(retryResponse.getTransactionReference());
        processRequest.setOutcome("SUCCESS");

        when(paymentRepository.findByTransactionReference(retryResponse.getTransactionReference())).thenReturn(Optional.of(newPayment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        PaymentResponse finalResponse = paymentService.processPayment(processRequest, "rahul@example.com", false);
        assertEquals("DEMO_PAID", finalResponse.getPaymentStatus());
        assertEquals("CONFIRMED", finalResponse.getBookingStatus());
    }

    @Test
    void testGetPaymentsByBookingId_ReturnsHistory() {
        Payment p1 = new Payment(1L, "DEMO-TXN-2026-0001", 100L, 1L, 5000.0, "INR", "CREDIT_CARD", "FAILED", "Declined", true, "Visa", LocalDateTime.now().minusHours(1), LocalDateTime.now().minusHours(1));
        Payment p2 = new Payment(2L, "DEMO-TXN-2026-0002", 100L, 1L, 5000.0, "INR", "UPI", "DEMO_PAID", null, true, "GPay", LocalDateTime.now(), LocalDateTime.now());

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findByBookingIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(p2, p1));

        List<PaymentResponse> history = paymentService.getPaymentsByBookingId(100L, "rahul@example.com", false);

        assertEquals(2, history.size());
        assertEquals("DEMO-TXN-2026-0002", history.get(0).getTransactionReference());
        assertEquals("DEMO_PAID", history.get(0).getPaymentStatus());
        assertEquals("FAILED", history.get(1).getPaymentStatus());
    }

    @Test
    void testCreateRazorpayOrder_Success() {
        RazorpayOrderRequest request = new RazorpayOrderRequest(100L);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setPaymentId(60L);
            return p;
        });

        RazorpayOrderResponse response = paymentService.createRazorpayOrder(request, "rahul@example.com", false);

        assertNotNull(response);
        assertNotNull(response.getOrderId());
        assertEquals(500000L, response.getAmount()); // 5000 * 100 paise
        assertEquals("INR", response.getCurrency());
        assertEquals(100L, response.getBookingId());
        assertEquals("TE-2026-X8Y9Z1A", response.getBookingReference());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void testCreateRazorpayOrder_CancelledBooking_Throws() {
        RazorpayOrderRequest request = new RazorpayOrderRequest(100L);
        testBooking.setBookingStatus("CANCELLED");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        assertThrows(IllegalStateException.class, () ->
                paymentService.createRazorpayOrder(request, "rahul@example.com", false));
    }

    @Test
    void testCreateRazorpayOrder_AlreadyPaid_Throws() {
        RazorpayOrderRequest request = new RazorpayOrderRequest(100L);
        testBooking.setBookingStatus("CONFIRMED");
        testBooking.setPaymentStatus("PAID");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        assertThrows(IllegalStateException.class, () ->
                paymentService.createRazorpayOrder(request, "rahul@example.com", false));
    }

    @Test
    void testVerifyRazorpayPayment_ValidSignature_Success() {
        String orderId = "order_test_100_abc";
        String paymentId = "pay_test_999_xyz";
        String validSignature = paymentService.calculateSignature(orderId, paymentId, "test_key_secret");

        RazorpayVerifyRequest verifyRequest = new RazorpayVerifyRequest(100L, orderId, paymentId, validSignature);

        Payment pendingPayment = new Payment();
        pendingPayment.setPaymentId(70L);
        pendingPayment.setBookingId(100L);
        pendingPayment.setUserId(1L);
        pendingPayment.setRazorpayOrderId(orderId);
        pendingPayment.setPaymentStatus("PENDING");
        pendingPayment.setPaymentMethod("RAZORPAY");
        pendingPayment.setAmount(5000.0);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(pendingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponse response = paymentService.verifyRazorpayPayment(verifyRequest, "rahul@example.com", false);

        assertNotNull(response);
        assertEquals("PAID", response.getPaymentStatus());
        assertEquals("CONFIRMED", response.getBookingStatus());
        assertEquals("RAZORPAY", response.getPaymentMethod());
        assertEquals(paymentId, response.getRazorpayPaymentId());
        assertEquals(paymentId, testBooking.getTransactionReference());
        assertEquals("PAID", testBooking.getPaymentStatus());
        assertEquals("CONFIRMED", testBooking.getBookingStatus());
    }

    @Test
    void testVerifyRazorpayPayment_InvalidSignature_Throws() {
        String orderId = "order_test_100_abc";
        String paymentId = "pay_test_999_xyz";
        String invalidSignature = "invalid_signature_hex_code";

        RazorpayVerifyRequest verifyRequest = new RazorpayVerifyRequest(100L, orderId, paymentId, invalidSignature);

        Payment pendingPayment = new Payment();
        pendingPayment.setPaymentId(70L);
        pendingPayment.setBookingId(100L);
        pendingPayment.setUserId(1L);
        pendingPayment.setRazorpayOrderId(orderId);
        pendingPayment.setPaymentStatus("PENDING");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(pendingPayment));

        assertThrows(IllegalArgumentException.class, () ->
                paymentService.verifyRazorpayPayment(verifyRequest, "rahul@example.com", false));

        assertEquals("FAILED", pendingPayment.getPaymentStatus());
        assertEquals("FAILED", testBooking.getPaymentStatus());
    }

    @Test
    void testVerifyRazorpayPayment_AlreadyConfirmed_Throws() {
        RazorpayVerifyRequest verifyRequest = new RazorpayVerifyRequest(100L, "order_1", "pay_1", "sig_1");
        testBooking.setBookingStatus("CONFIRMED");
        testBooking.setPaymentStatus("PAID");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        assertThrows(IllegalStateException.class, () ->
                paymentService.verifyRazorpayPayment(verifyRequest, "rahul@example.com", false));
    }

    // ── Razorpay Webhook Tests ───────────────────────────────────────────────

    @Test
    void testVerifyWebhookSignature_ValidSignature_ReturnsTrue() {
        String payload = "{\"event\":\"payment.captured\"}";
        String secret = "test_webhook_secret";
        String validSignature = paymentService.calculateWebhookSignature(payload, secret);

        boolean isValid = paymentService.verifyWebhookSignature(payload, validSignature, secret);
        assertTrue(isValid);
    }

    @Test
    void testVerifyWebhookSignature_InvalidSignature_ReturnsFalse() {
        String payload = "{\"event\":\"payment.captured\"}";
        String secret = "test_webhook_secret";

        boolean isValid = paymentService.verifyWebhookSignature(payload, "invalid_sig", secret);
        assertFalse(isValid);
    }

    @Test
    void testHandleWebhookEvent_InvalidSignature_Throws() {
        String payload = "{\"event\":\"payment.captured\"}";
        assertThrows(IllegalArgumentException.class, () ->
                paymentService.handleWebhookEvent(payload, "bad_signature"));
    }

    @Test
    void testHandleWebhookEvent_MalformedJson_Throws() {
        String invalidPayload = "{malformed-json";
        String validSig = paymentService.calculateWebhookSignature(invalidPayload, "test_webhook_secret");

        assertThrows(IllegalArgumentException.class, () ->
                paymentService.handleWebhookEvent(invalidPayload, validSig));
    }

    @Test
    void testHandleWebhookEvent_PaymentCaptured_Success() {
        String payload = "{" +
                "\"event\":\"payment.captured\"," +
                "\"payload\":{" +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_rzp_12345\"," +
                "      \"order_id\":\"order_rzp_67890\"," +
                "      \"amount\":500000," +
                "      \"currency\":\"INR\"," +
                "      \"notes\":{\"bookingId\":\"100\"}" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment pendingPayment = new Payment();
        pendingPayment.setPaymentId(80L);
        pendingPayment.setBookingId(100L);
        pendingPayment.setUserId(1L);
        pendingPayment.setRazorpayOrderId("order_rzp_67890");
        pendingPayment.setPaymentStatus("PENDING");
        pendingPayment.setPaymentMethod("RAZORPAY");

        when(paymentRepository.findByRazorpayPaymentId("pay_rzp_12345")).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_rzp_67890")).thenReturn(Optional.of(pendingPayment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("success", result.get("status"));
        assertEquals("payment.captured", result.get("event"));
        assertEquals("PAID", pendingPayment.getPaymentStatus());
        assertEquals("pay_rzp_12345", pendingPayment.getRazorpayPaymentId());
        assertEquals("PAID", testBooking.getPaymentStatus());
        assertEquals("CONFIRMED", testBooking.getBookingStatus());
        assertEquals("pay_rzp_12345", testBooking.getTransactionReference());
    }

    @Test
    void testHandleWebhookEvent_PaymentCaptured_IdempotentAlreadyPaid() {
        String payload = "{" +
                "\"event\":\"payment.captured\"," +
                "\"payload\":{" +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_rzp_already_paid\"," +
                "      \"order_id\":\"order_rzp_67890\"," +
                "      \"amount\":500000" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment paidPayment = new Payment();
        paidPayment.setPaymentId(80L);
        paidPayment.setBookingId(100L);
        paidPayment.setUserId(1L);
        paidPayment.setRazorpayPaymentId("pay_rzp_already_paid");
        paidPayment.setPaymentStatus("PAID");

        when(paymentRepository.findByRazorpayPaymentId("pay_rzp_already_paid")).thenReturn(Optional.of(paidPayment));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("already_processed", result.get("status"));
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void testHandleWebhookEvent_PaymentFailed_Success() {
        String payload = "{" +
                "\"event\":\"payment.failed\"," +
                "\"payload\":{" +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_rzp_failed_1\"," +
                "      \"order_id\":\"order_rzp_fail\"," +
                "      \"error_description\":\"Bank server down\"" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment pendingPayment = new Payment();
        pendingPayment.setPaymentId(85L);
        pendingPayment.setBookingId(100L);
        pendingPayment.setRazorpayOrderId("order_rzp_fail");
        pendingPayment.setPaymentStatus("PENDING");

        when(paymentRepository.findByRazorpayPaymentId("pay_rzp_failed_1")).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_rzp_fail")).thenReturn(Optional.of(pendingPayment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("success", result.get("status"));
        assertEquals("FAILED", pendingPayment.getPaymentStatus());
        assertEquals("Bank server down", pendingPayment.getFailureReason());
        assertEquals("FAILED", testBooking.getPaymentStatus());
    }

    @Test
    void testHandleWebhookEvent_PaymentFailed_IgnoredIfAlreadyPaid() {
        String payload = "{" +
                "\"event\":\"payment.failed\"," +
                "\"payload\":{" +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_rzp_paid_1\"," +
                "      \"order_id\":\"order_rzp_paid\"" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment paidPayment = new Payment();
        paidPayment.setPaymentId(90L);
        paidPayment.setBookingId(100L);
        paidPayment.setRazorpayOrderId("order_rzp_paid");
        paidPayment.setPaymentStatus("PAID");

        when(paymentRepository.findByRazorpayPaymentId("pay_rzp_paid_1")).thenReturn(Optional.of(paidPayment));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("ignored", result.get("status"));
        assertEquals("PAID", paidPayment.getPaymentStatus());
    }

    @Test
    void testHandleWebhookEvent_OrderPaid_Success() {
        String payload = "{" +
                "\"event\":\"order.paid\"," +
                "\"payload\":{" +
                "  \"order\":{" +
                "    \"entity\":{" +
                "      \"id\":\"order_rzp_order_paid_1\"," +
                "      \"amount_paid\":500000" +
                "    }" +
                "  }," +
                "  \"payment\":{" +
                "    \"entity\":{" +
                "      \"id\":\"pay_rzp_order_paid_1\"" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment pendingPayment = new Payment();
        pendingPayment.setPaymentId(95L);
        pendingPayment.setBookingId(100L);
        pendingPayment.setRazorpayOrderId("order_rzp_order_paid_1");
        pendingPayment.setPaymentStatus("PENDING");

        when(paymentRepository.findByRazorpayOrderId("order_rzp_order_paid_1")).thenReturn(Optional.of(pendingPayment));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("success", result.get("status"));
        assertEquals("PAID", pendingPayment.getPaymentStatus());
        assertEquals("pay_rzp_order_paid_1", pendingPayment.getRazorpayPaymentId());
        assertEquals("CONFIRMED", testBooking.getBookingStatus());
        assertEquals("PAID", testBooking.getPaymentStatus());
    }

    @Test
    void testHandleWebhookEvent_OrderPaid_IdempotentAlreadyPaid() {
        String payload = "{" +
                "\"event\":\"order.paid\"," +
                "\"payload\":{" +
                "  \"order\":{" +
                "    \"entity\":{" +
                "      \"id\":\"order_rzp_already_done\"" +
                "    }" +
                "  }" +
                "}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Payment paidPayment = new Payment();
        paidPayment.setPaymentId(96L);
        paidPayment.setBookingId(100L);
        paidPayment.setRazorpayOrderId("order_rzp_already_done");
        paidPayment.setPaymentStatus("PAID");

        when(paymentRepository.findByRazorpayOrderId("order_rzp_already_done")).thenReturn(Optional.of(paidPayment));

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("already_processed", result.get("status"));
    }

    @Test
    void testHandleWebhookEvent_UnhandledEvent_Ignored() {
        String payload = "{\"event\":\"refund.processed\",\"payload\":{}}";
        String signature = paymentService.calculateWebhookSignature(payload, "test_webhook_secret");

        Map<String, Object> result = paymentService.handleWebhookEvent(payload, signature);

        assertEquals("ignored", result.get("status"));
    }

    @Test
    void testVerifyRazorpayPayment_MissingSecret_Throws() {
        paymentService.setRazorpayKeys("test_key_id", "");
        RazorpayVerifyRequest verifyRequest = new RazorpayVerifyRequest(100L, "order_1", "pay_1", "sig_1");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(testBooking));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.verifyRazorpayPayment(verifyRequest, "rahul@example.com", false));
        assertTrue(ex.getMessage().contains("Razorpay Key Secret is not configured"));
    }

    @Test
    void testHandleWebhookEvent_MissingSecret_Throws() {
        paymentService.setRazorpayWebhookSecret("");
        String payload = "{\"event\":\"payment.captured\"}";

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.handleWebhookEvent(payload, "any_sig"));
        assertTrue(ex.getMessage().contains("Razorpay Webhook Secret is not configured"));
    }
}

