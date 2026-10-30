package com.klu.service;

import com.klu.dto.BookingRequest;
import com.klu.model.Booking;
import com.klu.model.Cab;
import com.klu.model.Flight;
import com.klu.model.Hotel;
import com.klu.model.User;
import com.klu.model.Payment;
import com.klu.repository.BookingRepository;
import com.klu.repository.CabRepository;
import com.klu.repository.FlightRepository;
import com.klu.repository.HotelRepository;
import com.klu.repository.PaymentRepository;
import com.klu.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final HotelRepository hotelRepository;
    private final CabRepository cabRepository;
    private final PaymentRepository paymentRepository;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          FlightRepository flightRepository,
                          HotelRepository hotelRepository,
                          CabRepository cabRepository) {
        this(bookingRepository, userRepository, flightRepository, hotelRepository, cabRepository, null);
    }

    @Autowired
    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          FlightRepository flightRepository,
                          HotelRepository hotelRepository,
                          CabRepository cabRepository,
                          PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.flightRepository = flightRepository;
        this.hotelRepository = hotelRepository;
        this.cabRepository = cabRepository;
        this.paymentRepository = paymentRepository;
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

    // ── Create Booking with Authenticated User ────────────────────────────────
    @Transactional
    public Booking createBooking(BookingRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
        request.setUserId(user.getUserId());
        return processBooking(request);
    }

    // ── Create Booking overload (used by tests / admin) ──────────────────────
    @Transactional
    public Booking createBooking(BookingRequest request) {
        if (request.getUserId() == null || !userRepository.existsById(request.getUserId())) {
            throw new RuntimeException("Valid user ID is required to create a booking");
        }
        return processBooking(request);
    }

    private Booking processBooking(BookingRequest request) {
        if (request.getFlightId() == null && request.getHotelId() == null && request.getCabId() == null) {
            throw new IllegalArgumentException("At least one travel service (flight, hotel, or cab) must be selected");
        }

        double total = 0.0;

        // 1. Flight Inventory & Pricing Validation
        if (request.getFlightId() != null) {
            Flight flight = flightRepository.findById(request.getFlightId())
                    .orElseThrow(() -> new RuntimeException("Flight not found with id: " + request.getFlightId()));

            if (!"AVAILABLE".equalsIgnoreCase(flight.getStatus()) || flight.getAvailableSeats() <= 0) {
                throw new IllegalStateException("Flight " + flight.getFlightNumber() + " has no available seats or is not available for booking");
            }

            // Deduct seat inventory
            flight.setAvailableSeats(flight.getAvailableSeats() - 1);
            if (flight.getAvailableSeats() == 0) {
                flight.setStatus("FULL");
            }
            flightRepository.save(flight);
            total += flight.getPrice();
        }

        // 2. Hotel Inventory & Pricing Validation
        if (request.getHotelId() != null) {
            Hotel hotel = hotelRepository.findById(request.getHotelId())
                    .orElseThrow(() -> new RuntimeException("Hotel not found with id: " + request.getHotelId()));

            if (!"AVAILABLE".equalsIgnoreCase(hotel.getStatus()) || hotel.getAvailableRooms() <= 0) {
                throw new IllegalStateException("Hotel " + hotel.getHotelName() + " has no available rooms or is not open for booking");
            }

            // Deduct room inventory
            hotel.setAvailableRooms(hotel.getAvailableRooms() - 1);
            if (hotel.getAvailableRooms() == 0) {
                hotel.setStatus("FULL");
            }
            hotelRepository.save(hotel);
            total += hotel.getPricePerNight();
        }

        // 3. Cab Inventory & Pricing Validation
        if (request.getCabId() != null) {
            Cab cab = cabRepository.findById(request.getCabId())
                    .orElseThrow(() -> new RuntimeException("Cab not found with id: " + request.getCabId()));

            if (!"AVAILABLE".equalsIgnoreCase(cab.getStatus())) {
                throw new IllegalStateException("Cab is currently unavailable or already booked");
            }

            // Reserve cab
            cab.setStatus("BOOKED");
            cabRepository.save(cab);
            total += cab.getPrice();
        }

        // 4. Generate Unique Booking Reference
        String reference = generateBookingReference();

        // 5. Build Booking
        Booking booking = new Booking();
        booking.setBookingReference(reference);
        booking.setUserId(request.getUserId());
        booking.setFlightId(request.getFlightId());
        booking.setHotelId(request.getHotelId());
        booking.setCabId(request.getCabId());
        booking.setTravellerName(request.getTravellerName().trim());
        booking.setTravellerEmail(request.getTravellerEmail().trim());
        booking.setTravellerPhone(request.getTravellerPhone() != null ? request.getTravellerPhone().trim() : "");
        booking.setTravelDate(request.getTravelDate());
        booking.setTotalAmount(total);

        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "DEMO";
        booking.setPaymentMethod(paymentMethod);

        // 6. Explicitly Label Payment & Booking Status
        // Never mark unverified live payments PAID automatically
        if ("DEMO".equalsIgnoreCase(paymentMethod)) {
            String txRef = generateDemoTransactionReference();
            booking.setTransactionReference(txRef);
            booking.setPaymentStatus("DEMO_PAID");
            booking.setBookingStatus("CONFIRMED");
            Booking savedBooking = bookingRepository.save(booking);

            if (paymentRepository != null) {
                Payment payment = new Payment();
                payment.setTransactionReference(txRef);
                payment.setBookingId(savedBooking.getBookingId());
                payment.setUserId(savedBooking.getUserId());
                payment.setAmount(savedBooking.getTotalAmount());
                payment.setCurrency("INR");
                payment.setPaymentMethod("DEMO");
                payment.setPaymentStatus("DEMO_PAID");
                payment.setDemo(true);
                payment.setSimulatedProvider("Instant Demo Mode");
                payment.setCreatedAt(LocalDateTime.now());
                payment.setCompletedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
            return savedBooking;
        } else {
            booking.setPaymentStatus("PENDING");
            booking.setBookingStatus("PENDING");
            return bookingRepository.save(booking);
        }
    }

    // ── Get All Bookings (Admin only) ─────────────────────────────────────────
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ── Get Booking by ID with Ownership Validation ───────────────────────────
    public Booking getBookingById(Long id, String userEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        if (!isAdmin) {
            User user = findUserByEmail(userEmail);
            if (!booking.getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("You are not authorized to view this booking");
            }
        }

        return booking;
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    // ── Get Bookings by User with Ownership Validation ───────────────────────
    public List<Booking> getBookingsByUser(Long userId, String userEmail, boolean isAdmin) {
        if (!isAdmin) {
            User user = findUserByEmail(userEmail);
            if (!user.getUserId().equals(userId)) {
                throw new AccessDeniedException("You are not authorized to view bookings of another user");
            }
        }
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    // ── Update Booking Status with Inventory Restoration & Refund Handling ────
    @Transactional
    public Booking updateBookingStatus(Long id, String status, String userEmail, boolean isAdmin) {
        Booking booking = getBookingById(id);

        if (!isAdmin) {
            User user = findUserByEmail(userEmail);
            if (!booking.getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("You are not authorized to modify this booking");
            }
            if (!"CANCELLED".equalsIgnoreCase(status)) {
                throw new AccessDeniedException("Users can only cancel their bookings. Status changes to " + status + " require administrator privileges.");
            }
        }

        return applyStatusChange(booking, status);
    }

    @Transactional
    public Booking updateBookingStatus(Long id, String status) {
        Booking booking = getBookingById(id);
        return applyStatusChange(booking, status);
    }

    private Booking applyStatusChange(Booking booking, String newStatus) {
        String targetStatus = newStatus != null ? newStatus.toUpperCase() : "";
        String currentStatus = booking.getBookingStatus();

        if ("CANCELLED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Booking is already CANCELLED and cannot be modified");
        }
        if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException("Booking is already COMPLETED and cannot be modified");
        }

        if ("CANCELLED".equalsIgnoreCase(targetStatus)) {
            booking.setBookingStatus("CANCELLED");

            // Correct Cancellation & Refund Handling
            if ("PAID".equalsIgnoreCase(booking.getPaymentStatus()) || "DEMO_PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
                booking.setPaymentStatus("REFUNDED");
                if (paymentRepository != null) {
                    List<Payment> payments = paymentRepository.findByBookingIdOrderByCreatedAtDesc(booking.getBookingId());
                    for (Payment p : payments) {
                        if ("PAID".equalsIgnoreCase(p.getPaymentStatus()) || "DEMO_PAID".equalsIgnoreCase(p.getPaymentStatus())) {
                            p.setPaymentStatus("REFUNDED");
                            p.setFailureReason("Booking cancelled by user - simulated refund issued");
                            paymentRepository.save(p);
                        }
                    }
                }
            } else {
                booking.setPaymentStatus("CANCELLED");
            }

            // Restore Inventory
            if (booking.getFlightId() != null) {
                flightRepository.findById(booking.getFlightId()).ifPresent(flight -> {
                    flight.setAvailableSeats(flight.getAvailableSeats() + 1);
                    if ("FULL".equalsIgnoreCase(flight.getStatus())) {
                        flight.setStatus("AVAILABLE");
                    }
                    flightRepository.save(flight);
                });
            }

            if (booking.getHotelId() != null) {
                hotelRepository.findById(booking.getHotelId()).ifPresent(hotel -> {
                    hotel.setAvailableRooms(hotel.getAvailableRooms() + 1);
                    if ("FULL".equalsIgnoreCase(hotel.getStatus())) {
                        hotel.setStatus("AVAILABLE");
                    }
                    hotelRepository.save(hotel);
                });
            }

            if (booking.getCabId() != null) {
                cabRepository.findById(booking.getCabId()).ifPresent(cab -> {
                    cab.setStatus("AVAILABLE");
                    cabRepository.save(cab);
                });
            }
        } else if ("CONFIRMED".equalsIgnoreCase(targetStatus)) {
            booking.setBookingStatus("CONFIRMED");
            if ("PENDING".equalsIgnoreCase(booking.getPaymentStatus())) {
                booking.setPaymentStatus("PAID");
            }
        } else if ("COMPLETED".equalsIgnoreCase(targetStatus)) {
            booking.setBookingStatus("COMPLETED");
        } else {
            throw new IllegalArgumentException("Unsupported booking status: " + newStatus);
        }

        return bookingRepository.save(booking);
    }

    // ── Collision-Free Unique Booking Reference Generation ────────────────────
    private synchronized String generateBookingReference() {
        int year = Year.now().getValue();
        String ref;
        do {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 7).toUpperCase();
            ref = String.format("TE-%d-%s", year, suffix);
        } while (bookingRepository.findByBookingReference(ref).isPresent());
        return ref;
    }

    private synchronized String generateDemoTransactionReference() {
        int year = Year.now().getValue();
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return String.format("DEMO-TXN-%d-%s", year, suffix);
    }
}
