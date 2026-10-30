package com.klu.config;

import com.klu.model.Cab;
import com.klu.model.Flight;
import com.klu.model.Hotel;
import com.klu.model.Role;
import com.klu.model.User;
import com.klu.repository.CabRepository;
import com.klu.repository.FlightRepository;
import com.klu.repository.HotelRepository;
import com.klu.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(FlightRepository flightRepository, 
                                      HotelRepository hotelRepository, 
                                      CabRepository cabRepository,
                                      UserRepository userRepository,
                                      BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            // Initialize Demo User if not present
            if (!userRepository.existsByEmail("udayasri@email.com")) {
                User demoUser = new User();
                demoUser.setName("Udayasri");
                demoUser.setEmail("udayasri@email.com");
                demoUser.setPassword(passwordEncoder.encode("password123"));
                demoUser.setRole(Role.USER);
                userRepository.save(demoUser);
            }

            // Initialize Admin User if not present
            if (!userRepository.existsByEmail("admin@travelease.com")) {
                User adminUser = new User();
                adminUser.setName("TravelEase Admin");
                adminUser.setEmail("admin@travelease.com");
                adminUser.setPassword(passwordEncoder.encode("admin123"));
                adminUser.setRole(Role.ADMIN);
                userRepository.save(adminUser);
            }

            // Initialize / Seed Flights safely (preventing duplicates on restart)
            List<Flight> seedFlights = List.of(
                // Delhi -> Hyderabad (6 flights)
                new Flight(null, "IndiGo", "6E-2134", "Delhi", "Hyderabad", "06:15", "08:35", "2h 20m", 0, 4350.0, 52, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-839", "Delhi", "Hyderabad", "08:45", "11:05", "2h 20m", 0, 4890.0, 40, 4.2, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-829", "Delhi", "Hyderabad", "11:30", "13:50", "2h 20m", 0, 5450.0, 28, 4.7, "AVAILABLE"),
                new Flight(null, "Akasa Air", "QP-1421", "Delhi", "Hyderabad", "15:10", "17:35", "2h 25m", 0, 3799.0, 64, 4.3, "AVAILABLE"),
                new Flight(null, "SpiceJet", "SG-8169", "Delhi", "Hyderabad", "18:40", "21:05", "2h 25m", 0, 4150.0, 35, 3.9, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-5012", "Delhi", "Hyderabad", "21:15", "23:35", "2h 20m", 0, 4650.0, 48, 4.5, "AVAILABLE"),

                // Hyderabad -> Mumbai (6 flights)
                new Flight(null, "IndiGo", "6E-5311", "Hyderabad", "Mumbai", "06:00", "07:35", "1h 35m", 0, 3450.0, 55, 4.3, "AVAILABLE"),
                new Flight(null, "Air India", "AI-618", "Hyderabad", "Mumbai", "09:20", "11:00", "1h 40m", 0, 3850.0, 36, 4.1, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-852", "Hyderabad", "Mumbai", "13:15", "14:55", "1h 40m", 0, 4650.0, 30, 4.6, "AVAILABLE"),
                new Flight(null, "Akasa Air", "QP-1124", "Hyderabad", "Mumbai", "16:40", "18:20", "1h 40m", 0, 3199.0, 60, 4.2, "AVAILABLE"),
                new Flight(null, "SpiceJet", "SG-3023", "Hyderabad", "Mumbai", "19:50", "21:30", "1h 40m", 0, 3550.0, 42, 3.8, "AVAILABLE"),
                new Flight(null, "Air India", "AI-622", "Hyderabad", "Mumbai", "22:10", "23:50", "1h 40m", 0, 4100.0, 25, 4.3, "AVAILABLE"),

                // Hyderabad -> Delhi (6 flights)
                new Flight(null, "IndiGo", "6E-123", "Hyderabad", "Delhi", "07:00", "09:15", "2h 15m", 0, 4450.0, 45, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-544", "Hyderabad", "Delhi", "10:30", "12:45", "2h 15m", 0, 4950.0, 38, 4.2, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-870", "Hyderabad", "Delhi", "14:00", "16:15", "2h 15m", 0, 5600.0, 22, 4.8, "AVAILABLE"),
                new Flight(null, "Akasa Air", "QP-1518", "Hyderabad", "Delhi", "17:25", "19:45", "2h 20m", 0, 3699.0, 58, 4.1, "AVAILABLE"),
                new Flight(null, "SpiceJet", "SG-1082", "Hyderabad", "Delhi", "20:10", "22:30", "2h 20m", 0, 4050.0, 30, 3.9, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-6514", "Hyderabad", "Delhi", "22:45", "01:00", "2h 15m", 0, 4200.0, 50, 4.3, "AVAILABLE"),

                // Hyderabad -> Bengaluru (6 flights)
                new Flight(null, "IndiGo", "6E-412", "Hyderabad", "Bengaluru", "06:30", "07:45", "1h 15m", 0, 2850.0, 65, 4.3, "AVAILABLE"),
                new Flight(null, "Air India", "AI-517", "Hyderabad", "Bengaluru", "09:15", "10:30", "1h 15m", 0, 3250.0, 42, 4.1, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-894", "Hyderabad", "Bengaluru", "12:40", "13:55", "1h 15m", 0, 3950.0, 32, 4.7, "AVAILABLE"),
                new Flight(null, "Akasa Air", "QP-1302", "Hyderabad", "Bengaluru", "15:50", "17:05", "1h 15m", 0, 2699.0, 70, 4.2, "AVAILABLE"),
                new Flight(null, "SpiceJet", "SG-2051", "Hyderabad", "Bengaluru", "18:30", "19:45", "1h 15m", 0, 2950.0, 40, 3.8, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-789", "Hyderabad", "Bengaluru", "21:00", "22:15", "1h 15m", 0, 3100.0, 50, 4.4, "AVAILABLE"),

                // Additional popular routes
                new Flight(null, "Air India", "AI456", "Mumbai", "Bengaluru", "14:00", "15:45", "1h 45m", 0, 3200.0, 100, 4.1, "AVAILABLE"),
                new Flight(null, "Vistara", "UK789", "Delhi", "Chennai", "06:30", "09:20", "2h 50m", 0, 5800.0, 40, 4.6, "AVAILABLE"),
                new Flight(null, "SpiceJet", "SG101", "Hyderabad", "Kolkata", "18:00", "20:10", "2h 10m", 0, 3900.0, 60, 3.8, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E222", "Bengaluru", "Goa", "11:15", "12:30", "1h 15m", 0, 2500.0, 80, 4.2, "AVAILABLE"),

                // Hyderabad <-> Vijayawada
                new Flight(null, "IndiGo", "6E-7123", "Hyderabad", "Vijayawada", "07:15", "08:15", "1h 00m", 0, 2450.0, 50, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-542", "Hyderabad", "Vijayawada", "14:30", "15:30", "1h 00m", 0, 2890.0, 38, 4.2, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-7124", "Vijayawada", "Hyderabad", "08:45", "09:45", "1h 00m", 0, 2450.0, 45, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-543", "Vijayawada", "Hyderabad", "16:15", "17:15", "1h 00m", 0, 2750.0, 32, 4.1, "AVAILABLE"),

                // Hyderabad <-> Visakhapatnam
                new Flight(null, "IndiGo", "6E-902", "Hyderabad", "Visakhapatnam", "06:45", "08:00", "1h 15m", 0, 3150.0, 55, 4.3, "AVAILABLE"),
                new Flight(null, "Air India", "AI-451", "Hyderabad", "Visakhapatnam", "12:10", "13:25", "1h 15m", 0, 3600.0, 40, 4.2, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-621", "Hyderabad", "Visakhapatnam", "18:20", "19:40", "1h 20m", 0, 4200.0, 28, 4.7, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-903", "Visakhapatnam", "Hyderabad", "08:30", "09:45", "1h 15m", 0, 3150.0, 50, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-452", "Visakhapatnam", "Hyderabad", "14:00", "15:15", "1h 15m", 0, 3500.0, 35, 4.1, "AVAILABLE"),

                // Bengaluru <-> Vijayawada
                new Flight(null, "IndiGo", "6E-241", "Bengaluru", "Vijayawada", "09:00", "10:20", "1h 20m", 0, 2950.0, 60, 4.3, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-242", "Vijayawada", "Bengaluru", "11:00", "12:20", "1h 20m", 0, 2950.0, 52, 4.3, "AVAILABLE"),

                // Bengaluru <-> Visakhapatnam
                new Flight(null, "IndiGo", "6E-882", "Bengaluru", "Visakhapatnam", "07:30", "09:05", "1h 35m", 0, 3400.0, 48, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-671", "Visakhapatnam", "Bengaluru", "16:30", "18:05", "1h 35m", 0, 3850.0, 42, 4.2, "AVAILABLE"),

                // Bengaluru <-> Kochi
                new Flight(null, "IndiGo", "6E-455", "Bengaluru", "Kochi", "08:00", "09:10", "1h 10m", 0, 2650.0, 62, 4.5, "AVAILABLE"),
                new Flight(null, "Air India", "AI-508", "Bengaluru", "Kochi", "13:45", "14:55", "1h 10m", 0, 3100.0, 36, 4.2, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-456", "Kochi", "Bengaluru", "09:40", "10:50", "1h 10m", 0, 2650.0, 58, 4.4, "AVAILABLE"),

                // Delhi <-> Pune
                new Flight(null, "IndiGo", "6E-2184", "Delhi", "Pune", "06:10", "08:25", "2h 15m", 0, 4350.0, 46, 4.3, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-991", "Delhi", "Pune", "11:00", "13:10", "2h 10m", 0, 5250.0, 30, 4.7, "AVAILABLE"),
                new Flight(null, "Air India", "AI-851", "Pune", "Delhi", "09:00", "11:15", "2h 15m", 0, 4600.0, 38, 4.2, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-2185", "Pune", "Delhi", "19:15", "21:30", "2h 15m", 0, 4400.0, 50, 4.4, "AVAILABLE"),

                // Mumbai <-> Kochi
                new Flight(null, "IndiGo", "6E-5321", "Mumbai", "Kochi", "07:00", "09:00", "2h 00m", 0, 3850.0, 54, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-681", "Mumbai", "Kochi", "14:15", "16:20", "2h 05m", 0, 4200.0, 35, 4.1, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-5322", "Kochi", "Mumbai", "17:00", "19:05", "2h 05m", 0, 3850.0, 48, 4.3, "AVAILABLE"),

                // Mumbai <-> Kolkata
                new Flight(null, "IndiGo", "6E-334", "Mumbai", "Kolkata", "06:30", "09:10", "2h 40m", 0, 5100.0, 45, 4.3, "AVAILABLE"),
                new Flight(null, "Air India", "AI-772", "Mumbai", "Kolkata", "13:00", "15:45", "2h 45m", 0, 5600.0, 40, 4.2, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-720", "Kolkata", "Mumbai", "10:00", "12:45", "2h 45m", 0, 6100.0, 32, 4.7, "AVAILABLE"),

                // Chennai <-> Hyderabad
                new Flight(null, "IndiGo", "6E-7201", "Chennai", "Hyderabad", "06:45", "08:00", "1h 15m", 0, 2800.0, 60, 4.4, "AVAILABLE"),
                new Flight(null, "Vistara", "UK-830", "Chennai", "Hyderabad", "15:30", "16:45", "1h 15m", 0, 3500.0, 36, 4.7, "AVAILABLE"),
                new Flight(null, "IndiGo", "6E-7202", "Hyderabad", "Chennai", "08:35", "09:50", "1h 15m", 0, 2800.0, 55, 4.3, "AVAILABLE"),

                // Chennai <-> Kochi
                new Flight(null, "IndiGo", "6E-419", "Chennai", "Kochi", "08:15", "09:35", "1h 20m", 0, 2750.0, 50, 4.4, "AVAILABLE"),
                new Flight(null, "Air India", "AI-512", "Kochi", "Chennai", "16:00", "17:25", "1h 25m", 0, 3100.0, 42, 4.2, "AVAILABLE"),

                // Delhi <-> Kolkata
                new Flight(null, "IndiGo", "6E-205", "Delhi", "Kolkata", "07:10", "09:20", "2h 10m", 0, 4400.0, 52, 4.3, "AVAILABLE"),
                new Flight(null, "Air India", "AI-22", "Kolkata", "Delhi", "10:15", "12:35", "2h 20m", 0, 4900.0, 40, 4.2, "AVAILABLE"),

                // Pune <-> Bengaluru
                new Flight(null, "IndiGo", "6E-611", "Pune", "Bengaluru", "07:45", "09:15", "1h 30m", 0, 3150.0, 65, 4.4, "AVAILABLE"),
                new Flight(null, "Akasa Air", "QP-1102", "Bengaluru", "Pune", "17:00", "18:30", "1h 30m", 0, 2899.0, 70, 4.2, "AVAILABLE")
            );

            for (Flight flight : seedFlights) {
                if (!flightRepository.existsByFlightNumber(flight.getFlightNumber())) {
                    flightRepository.save(flight);
                }
            }

            // Initialize Hotels for all supported Indian cities
            List<Hotel> seedHotels = List.of(
                // Hyderabad
                new Hotel(null, "Taj Banjara", "Hyderabad", "Luxury hotel overlooking the lake in Banjara Hills", "Deluxe", 6500.0, 15, 4.7, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "Radisson Blu Plaza", "Hyderabad", "Modern business hotel in Banjara Hills", "Deluxe", 5200.0, 20, 4.4, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "ITC Kohenur", "Hyderabad", "Super luxury hotel overlooking Durgam Cheruvu in Hitec City", "Luxury Suite", 11500.0, 10, 4.9, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Novotel Hyderabad Hitec City", "Hyderabad", "Tranquil resort-style business hotel near IT corridor", "Executive", 4800.0, 25, 4.3, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "AVAILABLE"),
                new Hotel(null, "Lemon Tree Premier Hitec City", "Hyderabad", "Vibrant contemporary stay in the heart of Cyberabad", "Superior Room", 3800.0, 30, 4.1, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Vijayawada
                new Hotel(null, "The Gateway Hotel MG Road", "Vijayawada", "Premium business hotel with serene Krishna river views", "Deluxe River View", 4500.0, 18, 4.5, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "Novotel Vijayawada Varun", "Vijayawada", "International luxury hotel near city center with infinity pool", "Executive Suite", 5800.0, 12, 4.7, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Quality Hotel Daspalla", "Vijayawada", "Comfortable business stay with rooftop dining", "Standard", 3200.0, 22, 4.2, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "AVAILABLE"),
                new Hotel(null, "Hotel Ilapuram", "Vijayawada", "Classic hospitality near Vijayawada Railway Station", "Standard AC", 2400.0, 35, 3.9, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Bengaluru
                new Hotel(null, "The Leela Palace", "Bengaluru", "Grand palace architecture and lush gardens on Old Airport Road", "Royal Club", 9500.0, 8, 4.9, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "ITC Gardenia", "Bengaluru", "Eco-responsible luxury sanctuary near UB City", "Towers Room", 8800.0, 14, 4.8, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Taj West End", "Bengaluru", "Historic resort retreat nestled in 20 acres of flora", "Heritage Deluxe", 10200.0, 10, 4.9, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Fortune Select JP Cosmos", "Bengaluru", "Sophisticated business hotel near Cantonment Station", "Superior", 3800.0, 24, 4.1, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "AVAILABLE"),

                // Chennai
                new Hotel(null, "Taj Coromandel", "Chennai", "Timeless South Indian elegance and fine dining in Nungambakkam", "Luxury Room", 8200.0, 16, 4.8, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "ITC Grand Chola", "Chennai", "Colossal architectural masterpiece in Guindy", "Executive Suite", 9400.0, 12, 4.9, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Novotel Chennai OMR", "Chennai", "Modern hotel in the Sholinganallur IT hub", "Standard", 4200.0, 25, 4.2, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "The Park Chennai", "Chennai", "Boutique luxury hotel located on Anna Salai", "Deluxe Room", 5100.0, 20, 4.4, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "AVAILABLE"),

                // Mumbai
                new Hotel(null, "Trident Nariman Point", "Mumbai", "Iconic hotel overlooking the Arabian Sea and Marine Drive", "Sea View Deluxe", 7000.0, 20, 4.5, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "JW Marriott Juhu", "Mumbai", "Beachfront luxury and celebrity hot-spot", "Premier Suite", 11000.0, 10, 4.9, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Taj Lands End Bandra", "Mumbai", "Sea-facing luxury hotel overlooking Bandra Bandstand", "Deluxe Ocean", 9800.0, 15, 4.8, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "The Fern Goregaon", "Mumbai", "Environment-friendly luxury stay near Western Express Highway", "Winter Green", 4200.0, 28, 4.2, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Delhi
                new Hotel(null, "ITC Maurya", "Delhi", "Flagship luxury hotel in the Diplomatic Enclave, Chanakyapuri", "Executive Suite", 8500.0, 10, 4.8, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "Taj Palace", "Delhi", "Extensive manicured lawns and iconic hospitality in Chanakyapuri", "Deluxe Suite", 8900.0, 14, 4.8, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Hyatt Regency Delhi", "Delhi", "Distinguished lifestyle destination on Ring Road, Bhikaji Cama Place", "Standard King", 6800.0, 22, 4.6, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Radisson Blu Plaza Delhi Airport", "Delhi", "Convenient upscale retreat near IGI Airport", "Superior Room", 5500.0, 30, 4.4, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "AVAILABLE"),

                // Visakhapatnam
                new Hotel(null, "Novotel Visakhapatnam Varun Beach", "Visakhapatnam", "Scenic beachfront property along the Bay of Bengal", "Ocean View Suite", 6200.0, 16, 4.7, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "The Park Visakhapatnam", "Visakhapatnam", "Private beach access and tranquil coastal luxury", "Deluxe Beachfront", 4800.0, 20, 4.5, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Welcomhotel by ITC Hotels Devee Grand Bay", "Visakhapatnam", "Premium stay atop Beach Road with panoramic sea views", "Executive Club", 5400.0, 18, 4.6, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Dolphin Hotel", "Visakhapatnam", "Central hospitality in Daba Gardens near Vizag Railway Station", "Standard Room", 3100.0, 30, 4.1, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Kolkata
                new Hotel(null, "The Oberoi Grand", "Kolkata", "Grande Dame of Chowringhee with colonial era grandeur", "Luxury Room", 8600.0, 12, 4.9, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "ITC Sonar", "Kolkata", "Baganbari concept luxury hotel on JBS Haldane Avenue", "Deluxe Room", 7400.0, 20, 4.7, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "The Lalit Great Eastern", "Kolkata", "Asia's first luxury hotel, blend of Victorian and contemporary", "Heritage Deluxe", 5800.0, 18, 4.5, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Peerless Hotel Kolkata", "Kolkata", "Convenient city stay near Esplanade and New Market", "Standard Room", 3400.0, 28, 4.0, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Pune
                new Hotel(null, "JW Marriott Hotel Pune", "Pune", "Luxury benchmark on Senapati Bapat Road with fine dining", "Deluxe King", 8400.0, 15, 4.8, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "Conrad Pune", "Pune", "Hilton luxury flagship in vibrant Mangaldas Road", "Premier Suite", 9200.0, 12, 4.9, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Hyatt Pune Kalyani Nagar", "Pune", "Serene city stay with lush outdoor dining near airport", "Standard Room", 4900.0, 25, 4.5, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Lemon Tree Premier City Center", "Pune", "Comfortable business stay near Pune Railway Station", "Superior Room", 3500.0, 32, 4.1, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE"),

                // Kochi
                new Hotel(null, "Grand Hyatt Kochi Bolgatty", "Kochi", "Waterfront luxury resort overlooking Vembanad Lake", "Waterfront Suite", 7800.0, 14, 4.9, "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "AVAILABLE"),
                new Hotel(null, "Taj Malabar Resort & Spa", "Kochi", "Willingdon Island resort with views of Kochi harbour", "Heritage Sea View", 8500.0, 12, 4.8, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "AVAILABLE"),
                new Hotel(null, "Le Meridien Kochi", "Kochi", "Sprawling backwaters retreat on Maradu bypass", "Deluxe Room", 5200.0, 22, 4.5, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", "AVAILABLE"),
                new Hotel(null, "Casino Hotel CGH Earth", "Kochi", "Authentic Kerala eco-hospitality with Ayurvedic wellness", "Standard Room", 3900.0, 26, 4.2, "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", "AVAILABLE")
            );

            for (Hotel hotel : seedHotels) {
                if (!hotelRepository.existsByHotelNameAndLocation(hotel.getHotelName(), hotel.getLocation())) {
                    hotelRepository.save(hotel);
                }
            }

            // Initialize Cabs across all supported Indian cities
            List<Cab> seedCabs = List.of(
                // Hyderabad
                new Cab(null, "Ola", "Sedan", "Hyderabad Airport", "Hitech City", 4, 850.0, "45 mins", "AVAILABLE"),
                new Cab(null, "Uber", "SUV", "Hyderabad Airport", "Gachibowli", 6, 1150.0, "40 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Hyderabad Airport", "Banjara Hills", 4, 750.0, "50 mins", "AVAILABLE"),
                new Cab(null, "BluSmart", "Sedan", "Hyderabad Airport", "Jubilee Hills", 4, 920.0, "55 mins", "AVAILABLE"),
                new Cab(null, "Ola", "Sedan", "Secunderabad Railway Station", "Hitech City", 4, 550.0, "40 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Hitech City", "Hyderabad Airport", 4, 890.0, "45 mins", "AVAILABLE"),

                // Vijayawada
                new Cab(null, "Uber", "Sedan", "Vijayawada Airport", "Benz Circle", 4, 550.0, "35 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Vijayawada Airport", "MG Road", 6, 850.0, "40 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Vijayawada Railway Station", "Kanaka Durga Temple", 4, 300.0, "20 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Sedan", "Benz Circle", "Amaravati Secretariat", 4, 700.0, "45 mins", "AVAILABLE"),

                // Bengaluru
                new Cab(null, "Ola", "Sedan", "Bangalore Airport", "Koramangala", 4, 1250.0, "1 hr 15 mins", "AVAILABLE"),
                new Cab(null, "Uber", "SUV", "Bangalore Airport", "Indiranagar", 6, 1600.0, "1 hr 10 mins", "AVAILABLE"),
                new Cab(null, "BluSmart", "Sedan", "Bangalore Airport", "Whitefield", 4, 1350.0, "1 hr 20 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Bangalore Airport", "Electronic City", 4, 1400.0, "1 hr 30 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Koramangala", "MG Road", 4, 350.0, "30 mins", "AVAILABLE"),

                // Chennai
                new Cab(null, "Uber", "Sedan", "Chennai Airport", "T Nagar", 4, 650.0, "35 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Chennai Airport", "OMR IT Corridor", 6, 950.0, "45 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Chennai Airport", "Anna Nagar", 4, 600.0, "40 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Chennai Central Station", "Marina Beach", 4, 300.0, "20 mins", "AVAILABLE"),

                // Mumbai
                new Cab(null, "Meru", "Hatchback", "Mumbai Airport", "Andheri West", 4, 550.0, "30 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Mumbai Airport", "Bandra Kurla Complex", 4, 750.0, "35 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Mumbai Airport", "South Mumbai Colaba", 6, 1350.0, "1 hr 10 mins", "AVAILABLE"),
                new Cab(null, "BluSmart", "Sedan", "Bandra", "Dadar", 4, 400.0, "25 mins", "AVAILABLE"),

                // Delhi
                new Cab(null, "Uber", "SUV", "Delhi Airport", "Connaught Place", 6, 1100.0, "50 mins", "AVAILABLE"),
                new Cab(null, "Ola", "Sedan", "Delhi Airport", "Gurgaon Cyber Hub", 4, 750.0, "35 mins", "AVAILABLE"),
                new Cab(null, "BluSmart", "Sedan", "Delhi Airport", "Noida Sector 62", 4, 980.0, "1 hr 05 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "New Delhi Railway Station", "Delhi Airport", 4, 650.0, "45 mins", "AVAILABLE"),

                // Visakhapatnam
                new Cab(null, "Uber", "Sedan", "Visakhapatnam Airport", "Beach Road", 4, 520.0, "35 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Visakhapatnam Airport", "Siripuram", 6, 750.0, "30 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Visakhapatnam Airport", "Madhurawada IT SEZ", 4, 680.0, "50 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Sedan", "Vizag Railway Station", "Gajuwaka", 4, 400.0, "30 mins", "AVAILABLE"),

                // Kolkata
                new Cab(null, "Uber", "Sedan", "Kolkata Airport", "Park Street", 4, 680.0, "45 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Kolkata Airport", "Salt Lake Sector V", 6, 820.0, "35 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Kolkata Airport", "Howrah Railway Station", 4, 600.0, "50 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Salt Lake", "New Town", 4, 350.0, "25 mins", "AVAILABLE"),

                // Pune
                new Cab(null, "Ola", "Sedan", "Pune Airport", "Hinjewadi IT Park", 4, 850.0, "55 mins", "AVAILABLE"),
                new Cab(null, "Uber", "SUV", "Pune Airport", "Koregaon Park", 6, 650.0, "25 mins", "AVAILABLE"),
                new Cab(null, "BluSmart", "Sedan", "Pune Airport", "Viman Nagar", 4, 350.0, "15 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Pune Railway Station", "Kothrud", 4, 400.0, "30 mins", "AVAILABLE"),

                // Kochi
                new Cab(null, "Uber", "Sedan", "Kochi Airport", "Fort Kochi", 4, 1100.0, "1 hr 15 mins", "AVAILABLE"),
                new Cab(null, "Ola", "SUV", "Kochi Airport", "Marine Drive", 6, 980.0, "50 mins", "AVAILABLE"),
                new Cab(null, "Meru", "Hatchback", "Kochi Airport", "Kakkanad Infopark", 4, 750.0, "45 mins", "AVAILABLE"),
                new Cab(null, "Uber", "Premium", "Ernakulam South Station", "Edappally Lulu Mall", 4, 350.0, "25 mins", "AVAILABLE")
            );

            for (Cab cab : seedCabs) {
                if (!cabRepository.existsByProviderAndCabTypeAndPickupLocationAndDropLocation(
                        cab.getProvider(), cab.getCabType(), cab.getPickupLocation(), cab.getDropLocation())) {
                    cabRepository.save(cab);
                }
            }

            // Ensure demo cabs are available for booking simulation
            cabRepository.findAll().forEach(c -> {
                if ("BOOKED".equalsIgnoreCase(c.getStatus())) {
                    c.setStatus("AVAILABLE");
                    cabRepository.save(c);
                }
            });
        };
    }
}
