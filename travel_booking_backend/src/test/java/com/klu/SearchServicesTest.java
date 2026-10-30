package com.klu;

import com.klu.model.Cab;
import com.klu.model.Flight;
import com.klu.model.Hotel;
import com.klu.repository.CabRepository;
import com.klu.repository.FlightRepository;
import com.klu.repository.HotelRepository;
import com.klu.service.CabService;
import com.klu.service.FlightService;
import com.klu.service.HotelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SearchServicesTest {

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private CabRepository cabRepository;

    private FlightService flightService;
    private HotelService hotelService;
    private CabService cabService;

    @BeforeEach
    void setUp() {
        flightService = new FlightService(flightRepository);
        hotelService = new HotelService(hotelRepository);
        cabService = new CabService(cabRepository);
    }

    @Test
    @DisplayName("Flight search resolves full airport name and IATA code for Vijayawada and Visakhapatnam")
    void testFlightSearchRouteResolution() {
        Flight f1 = new Flight(1L, "IndiGo", "6E-7123", "Hyderabad", "Vijayawada", "07:15", "08:15", "1h 00m", 0, 2450.0, 50, 4.4, "AVAILABLE");
        Flight f2 = new Flight(2L, "Air India", "AI-451", "Hyderabad", "Visakhapatnam", "12:10", "13:25", "1h 15m", 0, 3600.0, 40, 4.2, "AVAILABLE");
        Flight f3 = new Flight(3L, "IndiGo", "6E-455", "Bengaluru", "Kochi", "08:00", "09:10", "1h 10m", 0, 2650.0, 62, 4.5, "AVAILABLE");

        when(flightRepository.findAll()).thenReturn(List.of(f1, f2, f3));

        // Test with full formatted airport dropdown label
        List<Flight> results = flightService.searchFlights(
                "Hyderabad (HYD) - Rajiv Gandhi International Airport",
                "Vijayawada (VGA) - Vijayawada International Airport");

        assertEquals(1, results.size());
        assertEquals("6E-7123", results.get(0).getFlightNumber());

        // Test with IATA code directly
        List<Flight> vtzResults = flightService.searchFlights("HYD", "VTZ");
        assertEquals(1, vtzResults.size());
        assertEquals("AI-451", vtzResults.get(0).getFlightNumber());

        // Test with city name directly
        List<Flight> kochiResults = flightService.searchFlights("Bangalore", "Cochin");
        assertEquals(1, kochiResults.size());
        assertEquals("6E-455", kochiResults.get(0).getFlightNumber());
    }

    @Test
    @DisplayName("Hotel search resolves city synonyms (Bengaluru/Bangalore) and comma-separated state queries")
    void testHotelSearchLocationMatching() {
        Hotel h1 = new Hotel(1L, "The Leela Palace", "Bengaluru", "Luxury palace", "Deluxe", 9500.0, 10, 4.9, "img", "AVAILABLE");
        Hotel h2 = new Hotel(2L, "The Gateway Hotel MG Road", "Vijayawada", "River view", "Deluxe", 4500.0, 15, 4.5, "img", "AVAILABLE");
        Hotel h3 = new Hotel(3L, "Taj Banjara", "Hyderabad", "Banjara Hills", "Deluxe", 6500.0, 12, 4.7, "img", "AVAILABLE");

        when(hotelRepository.findAll()).thenReturn(List.of(h1, h2, h3));

        // Test Bengaluru searched as Bangalore
        List<Hotel> bangaloreResults = hotelService.searchHotels("Bangalore");
        assertEquals(1, bangaloreResults.size());
        assertEquals("The Leela Palace", bangaloreResults.get(0).getHotelName());

        // Test Hyderabad searched as "Hyderabad, Telangana"
        List<Hotel> hydResults = hotelService.searchHotels("Hyderabad, Telangana");
        assertEquals(1, hydResults.size());
        assertEquals("Taj Banjara", hydResults.get(0).getHotelName());

        // Test Vijayawada
        List<Hotel> vgaResults = hotelService.searchHotels("Vijayawada");
        assertEquals(1, vgaResults.size());
        assertEquals("The Gateway Hotel MG Road", vgaResults.get(0).getHotelName());
    }

    @Test
    @DisplayName("Cab search successfully matches airport and city locations despite extra labels")
    void testCabSearchLocationMatching() {
        Cab c1 = new Cab(1L, "Ola", "Sedan", "Hyderabad Airport", "Hitech City", 4, 850.0, "45 mins", "AVAILABLE");
        Cab c2 = new Cab(2L, "Uber", "SUV", "Delhi Airport", "Connaught Place", 6, 1200.0, "50 mins", "AVAILABLE");
        Cab c3 = new Cab(3L, "Uber", "Sedan", "Vijayawada Airport", "Benz Circle", 4, 550.0, "35 mins", "AVAILABLE");

        when(cabRepository.findAll()).thenReturn(List.of(c1, c2, c3));

        // Test with full dropdown input: "Hyderabad Airport (RGIA)" -> "Hitech City, Hyderabad"
        List<Cab> hydCabs = cabService.searchCabs("Hyderabad Airport (RGIA)", "Hitech City, Hyderabad");
        assertFalse(hydCabs.isEmpty(), "Should find available cabs for Hyderabad route");
        assertEquals(1L, hydCabs.get(0).getCabId());

        // Test Vijayawada route
        List<Cab> vgaCabs = cabService.searchCabs("Vijayawada Airport (Gannavaram)", "Benz Circle, Vijayawada");
        assertFalse(vgaCabs.isEmpty(), "Should find available cabs for Vijayawada route");
        assertEquals(3L, vgaCabs.get(0).getCabId());
    }
}
