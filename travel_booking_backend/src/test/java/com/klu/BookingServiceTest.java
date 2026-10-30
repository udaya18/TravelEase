package com.klu;

import com.klu.dto.BookingRequest;
import com.klu.model.*;
import com.klu.repository.*;
import com.klu.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private CabRepository cabRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Flight testFlight;
    private Hotel testHotel;
    private Cab testCab;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User(1L, "Rahul Verma", "rahul@example.com", "encodedPass", Role.USER);
        testFlight = new Flight(10L, "IndiGo", "6E-2134", "Delhi", "Hyderabad", "06:15", "08:35", "2h 20m", 0, 4350.0, 5, 4.4, "AVAILABLE");
        testHotel = new Hotel(20L, "Taj Banjara", "Hyderabad", "Luxury hotel", "Deluxe", 6500.0, 3, 4.7, "http://img.jpg", "AVAILABLE");
        testCab = new Cab(30L, "Ola", "Sedan", "Airport", "Hotel", 4, 850.0, "45 mins", "AVAILABLE");
    }

    @Test
    void testCreateBooking_SuccessWithInventoryDeduction() {
        BookingRequest request = new BookingRequest();
        request.setFlightId(10L);
        request.setHotelId(20L);
        request.setCabId(30L);
        request.setTravellerName("Rahul Verma");
        request.setTravellerEmail("rahul@example.com");
        request.setTravelDate(LocalDate.now().plusDays(5));
        request.setPaymentMethod("DEMO");

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(flightRepository.findById(10L)).thenReturn(Optional.of(testFlight));
        when(hotelRepository.findById(20L)).thenReturn(Optional.of(testHotel));
        when(cabRepository.findById(30L)).thenReturn(Optional.of(testCab));
        when(bookingRepository.findByBookingReference(any())).thenReturn(Optional.empty());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setBookingId(100L);
            return b;
        });

        Booking result = bookingService.createBooking(request, "rahul@example.com");

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals("CONFIRMED", result.getBookingStatus());
        assertEquals("DEMO_PAID", result.getPaymentStatus());
        assertEquals(4350.0 + 6500.0 + 850.0, result.getTotalAmount());
        assertTrue(result.getBookingReference().startsWith("TE-"));

        // Verify inventory was decremented
        assertEquals(4, testFlight.getAvailableSeats());
        assertEquals(2, testHotel.getAvailableRooms());
        assertEquals("BOOKED", testCab.getStatus());

        verify(flightRepository).save(testFlight);
        verify(hotelRepository).save(testHotel);
        verify(cabRepository).save(testCab);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void testCreateBooking_OverbookingPrevention_FlightFull() {
        testFlight.setAvailableSeats(0);
        testFlight.setStatus("FULL");

        BookingRequest request = new BookingRequest();
        request.setFlightId(10L);
        request.setTravellerName("Rahul Verma");
        request.setTravellerEmail("rahul@example.com");
        request.setTravelDate(LocalDate.now().plusDays(5));

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(flightRepository.findById(10L)).thenReturn(Optional.of(testFlight));

        Exception ex = assertThrows(IllegalStateException.class, () -> {
            bookingService.createBooking(request, "rahul@example.com");
        });

        assertTrue(ex.getMessage().contains("no available seats"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void testCreateBooking_NoServiceSelected_Throws() {
        BookingRequest request = new BookingRequest();
        request.setTravellerName("Rahul Verma");
        request.setTravellerEmail("rahul@example.com");
        request.setTravelDate(LocalDate.now().plusDays(5));

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> {
            bookingService.createBooking(request, "rahul@example.com");
        });
    }

    @Test
    void testCancelBooking_RestoresInventoryAndRefunds() {
        Booking booking = new Booking();
        booking.setBookingId(100L);
        booking.setBookingReference("TE-2026-ABCDEF");
        booking.setUserId(1L);
        booking.setFlightId(10L);
        booking.setHotelId(20L);
        booking.setCabId(30L);
        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentStatus("DEMO_PAID");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(flightRepository.findById(10L)).thenReturn(Optional.of(testFlight));
        when(hotelRepository.findById(20L)).thenReturn(Optional.of(testHotel));
        when(cabRepository.findById(30L)).thenReturn(Optional.of(testCab));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking cancelled = bookingService.updateBookingStatus(100L, "CANCELLED", "rahul@example.com", false);

        assertEquals("CANCELLED", cancelled.getBookingStatus());
        assertEquals("REFUNDED", cancelled.getPaymentStatus());
        assertEquals(6, testFlight.getAvailableSeats());
        assertEquals(4, testHotel.getAvailableRooms());
        assertEquals("AVAILABLE", testCab.getStatus());
    }

    @Test
    void testModifyCancelledBooking_Throws() {
        Booking booking = new Booking();
        booking.setBookingId(100L);
        booking.setUserId(1L);
        booking.setBookingStatus("CANCELLED");
        booking.setPaymentStatus("REFUNDED");

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(IllegalStateException.class, () -> {
            bookingService.updateBookingStatus(100L, "CONFIRMED", "rahul@example.com", true);
        });
    }

    @Test
    void testCancelBooking_WithPaymentRecordsRefunded() {
        Booking booking = new Booking();
        booking.setBookingId(100L);
        booking.setBookingReference("TE-2026-ABCDEF");
        booking.setUserId(1L);
        booking.setFlightId(10L);
        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentStatus("DEMO_PAID");

        Payment payment = new Payment(1L, "DEMO-TXN-2026-REF1234", 100L, 1L, 4350.0, "INR", "UPI", "DEMO_PAID", null, true, "GPay", null, null);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(testUser));
        when(flightRepository.findById(10L)).thenReturn(Optional.of(testFlight));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(paymentRepository.findByBookingIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(payment));

        Booking cancelled = bookingService.updateBookingStatus(100L, "CANCELLED", "rahul@example.com", false);

        assertEquals("CANCELLED", cancelled.getBookingStatus());
        assertEquals("REFUNDED", cancelled.getPaymentStatus());
        assertEquals("REFUNDED", payment.getPaymentStatus());
        assertTrue(payment.getFailureReason().contains("simulated refund"));
        verify(paymentRepository).save(payment);
    }
}
