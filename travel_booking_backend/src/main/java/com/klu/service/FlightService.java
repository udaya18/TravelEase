package com.klu.service;

import com.klu.model.Flight;
import com.klu.repository.FlightRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class FlightService {

    private final FlightRepository flightRepository;

    private static final Map<String, String> CITY_TO_CODE = new HashMap<>();
    private static final Map<String, String> CODE_TO_CITY = new HashMap<>();

    static {
        registerCityCode("delhi", "del");
        registerCityCode("new delhi", "del");
        registerCityCode("mumbai", "bom");
        registerCityCode("bombay", "bom");
        registerCityCode("bengaluru", "blr");
        registerCityCode("bangalore", "blr");
        registerCityCode("hyderabad", "hyd");
        registerCityCode("chennai", "maa");
        registerCityCode("madras", "maa");
        registerCityCode("kolkata", "ccu");
        registerCityCode("calcutta", "ccu");
        registerCityCode("goa", "goi");
        registerCityCode("kochi", "cok");
        registerCityCode("cochin", "cok");
        registerCityCode("jaipur", "jai");
        registerCityCode("ahmedabad", "amd");
        registerCityCode("pune", "pnq");
        registerCityCode("vijayawada", "vga");
        registerCityCode("visakhapatnam", "vtz");
        registerCityCode("vizag", "vtz");
    }

    private static void registerCityCode(String city, String code) {
        CITY_TO_CODE.put(city.toLowerCase(), code.toLowerCase());
        CODE_TO_CITY.put(code.toLowerCase(), city.toLowerCase());
    }

    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    public Flight addFlight(Flight flight) {
        return flightRepository.save(flight);
    }

    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    public Flight getFlightById(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flight not found with id: " + id));
    }

    public Set<String> getLookupKeys(String input) {
        Set<String> keys = new HashSet<>();
        if (input == null || input.isBlank()) {
            return keys;
        }

        String raw = input.trim().toLowerCase();
        keys.add(raw);

        // Extract code from parentheses like "Delhi (DEL)"
        Pattern parenPattern = Pattern.compile("\\(([a-z0-9]+)\\)");
        Matcher matcher = parenPattern.matcher(raw);
        if (matcher.find()) {
            String inside = matcher.group(1).trim();
            keys.add(inside);
            if (CODE_TO_CITY.containsKey(inside)) {
                keys.add(CODE_TO_CITY.get(inside));
            }
        }

        // Clean out parentheses to get city name
        String cleaned = raw.replaceAll("\\s*\\([a-z0-9]+\\)", "").trim();
        if (!cleaned.isBlank()) {
            keys.add(cleaned);
            if (CITY_TO_CODE.containsKey(cleaned)) {
                keys.add(CITY_TO_CODE.get(cleaned));
            }
            if (CODE_TO_CITY.containsKey(cleaned)) {
                keys.add(CODE_TO_CITY.get(cleaned));
            }

            // Also handle hyphenated formats like "Hyderabad - Rajiv Gandhi International Airport"
            if (cleaned.contains("-")) {
                String cityPart = cleaned.split("-")[0].trim();
                if (!cityPart.isBlank()) {
                    keys.add(cityPart);
                    if (CITY_TO_CODE.containsKey(cityPart)) {
                        keys.add(CITY_TO_CODE.get(cityPart));
                    }
                    if (CODE_TO_CITY.containsKey(cityPart)) {
                        keys.add(CODE_TO_CITY.get(cityPart));
                    }
                }
            }
        }

        // Also check if raw without spaces is in map (e.g. newdelhi)
        String noSpace = cleaned.replace(" ", "");
        if (CITY_TO_CODE.containsKey(noSpace)) {
            keys.add(CITY_TO_CODE.get(noSpace));
        }

        // Handle Bangalore / Bengaluru synonym
        if (keys.contains("bangalore") || keys.contains("bengaluru") || keys.contains("blr")) {
            keys.add("bangalore");
            keys.add("bengaluru");
            keys.add("blr");
        }

        // Handle Visakhapatnam / Vizag synonym
        if (keys.contains("visakhapatnam") || keys.contains("vizag") || keys.contains("vtz")) {
            keys.add("visakhapatnam");
            keys.add("vizag");
            keys.add("vtz");
        }

        return keys;
    }

    private boolean matchesLocation(String storedLocation, String searchInput) {
        if (storedLocation == null) {
            return false;
        }
        if (searchInput == null || searchInput.isBlank()) {
            return true;
        }

        Set<String> searchKeys = getLookupKeys(searchInput);
        Set<String> storedKeys = getLookupKeys(storedLocation);

        for (String sKey : searchKeys) {
            if (sKey.isBlank()) continue;
            // Direct substring match in storedLocation string or vice versa
            if (storedLocation.toLowerCase().contains(sKey) || sKey.contains(storedLocation.toLowerCase())) {
                return true;
            }
            // Match against stored location synonyms/keys
            for (String stKey : storedKeys) {
                if (stKey.equalsIgnoreCase(sKey) || stKey.contains(sKey) || sKey.contains(stKey)) {
                    return true;
                }
            }
        }
        return false;
    }

    public List<Flight> searchFlights(String source, String destination) {
        boolean hasSource = (source != null && !source.isBlank());
        boolean hasDest = (destination != null && !destination.isBlank());

        if (!hasSource && !hasDest) {
            return flightRepository.findAll();
        }

        return flightRepository.findAll().stream()
                .filter(flight -> !hasSource || matchesLocation(flight.getSource(), source))
                .filter(flight -> !hasDest || matchesLocation(flight.getDestination(), destination))
                .collect(Collectors.toList());
    }

    public Flight updateFlight(Long id, Flight updated) {
        Flight existing = getFlightById(id);
        existing.setAirline(updated.getAirline());
        existing.setFlightNumber(updated.getFlightNumber());
        existing.setSource(updated.getSource());
        existing.setDestination(updated.getDestination());
        existing.setDepartureTime(updated.getDepartureTime());
        existing.setArrivalTime(updated.getArrivalTime());
        existing.setDuration(updated.getDuration());
        existing.setStops(updated.getStops());
        existing.setPrice(updated.getPrice());
        existing.setAvailableSeats(updated.getAvailableSeats());
        existing.setRating(updated.getRating());
        existing.setStatus(updated.getStatus());
        return flightRepository.save(existing);
    }

    public void deleteFlight(Long id) {
        flightRepository.deleteById(id);
    }
}
