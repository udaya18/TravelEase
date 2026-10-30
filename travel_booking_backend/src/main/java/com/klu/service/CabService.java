package com.klu.service;

import com.klu.model.Cab;
import com.klu.repository.CabRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CabService {

    private final CabRepository cabRepository;

    public CabService(CabRepository cabRepository) {
        this.cabRepository = cabRepository;
    }

    public Cab addCab(Cab cab) {
        return cabRepository.save(cab);
    }

    public List<Cab> getAllCabs() {
        return cabRepository.findAll();
    }

    public Cab getCabById(Long id) {
        return cabRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cab not found with id: " + id));
    }

    private static final Map<String, List<String>> CITY_SYNONYMS = new HashMap<>();

    static {
        registerSynonyms("bengaluru", "bangalore", "blr");
        registerSynonyms("delhi", "new delhi", "del", "gurgaon", "noida");
        registerSynonyms("mumbai", "bombay", "bom");
        registerSynonyms("chennai", "madras", "maa");
        registerSynonyms("kolkata", "calcutta", "ccu");
        registerSynonyms("kochi", "cochin", "cok", "ernakulam");
        registerSynonyms("visakhapatnam", "vizag", "vtz");
        registerSynonyms("hyderabad", "hyd", "secunderabad");
        registerSynonyms("vijayawada", "vga", "gannavaram", "amaravati");
        registerSynonyms("pune", "pnq");
        registerSynonyms("goa", "goi");
        registerSynonyms("jaipur", "jai");
        registerSynonyms("ahmedabad", "amd");
    }

    private static void registerSynonyms(String... terms) {
        List<String> list = java.util.Arrays.asList(terms);
        for (String term : terms) {
            CITY_SYNONYMS.put(term.toLowerCase(), list);
        }
    }

    private static final Set<String> STOP_WORDS = Set.of(
            "city", "airport", "station", "railway", "hotel", "road", "park", "street", "place", "hub", "point", "central", "west", "east", "north", "south", "nagar"
    );

    private java.util.Set<String> getTokens(String input) {
        java.util.Set<String> tokens = new java.util.HashSet<>();
        if (input == null || input.isBlank()) return tokens;

        String raw = input.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").trim();
        for (String word : raw.split("\\s+")) {
            if (word.length() > 2 && !STOP_WORDS.contains(word)) {
                tokens.add(word);
                if (CITY_SYNONYMS.containsKey(word)) {
                    tokens.addAll(CITY_SYNONYMS.get(word));
                }
            }
        }
        return tokens;
    }

    private boolean matchesLocation(String stored, String query) {
        if (query == null || query.isBlank()) return true;
        if (stored == null) return false;

        String s = stored.toLowerCase().trim();
        String q = query.toLowerCase().trim();

        // 1. Direct contains either direction
        if (s.contains(q) || q.contains(s)) return true;

        // 2. Token overlap
        java.util.Set<String> sTokens = getTokens(s);
        java.util.Set<String> qTokens = getTokens(q);

        for (String qt : qTokens) {
            if (sTokens.contains(qt)) {
                return true;
            }
        }
        return false;
    }

    public List<Cab> searchCabs(String pickupLocation, String dropLocation) {
        boolean hasPickup = (pickupLocation != null && !pickupLocation.isBlank());
        boolean hasDrop = (dropLocation != null && !dropLocation.isBlank());

        List<Cab> availableCabs = cabRepository.findAll().stream()
                .filter(cab -> cab.getStatus() == null || "AVAILABLE".equalsIgnoreCase(cab.getStatus()))
                .toList();

        if (!hasPickup && !hasDrop) {
            return availableCabs;
        }

        // First attempt: match both pickup and drop
        List<Cab> exactMatches = availableCabs.stream()
                .filter(cab -> !hasPickup || matchesLocation(cab.getPickupLocation(), pickupLocation))
                .filter(cab -> !hasDrop || matchesLocation(cab.getDropLocation(), dropLocation))
                .toList();

        if (!exactMatches.isEmpty()) {
            return exactMatches;
        }

        // Fallback: match by city/pickup area or drop area so traveler is never left stranded
        List<Cab> cityMatches = availableCabs.stream()
                .filter(cab -> (hasPickup && matchesLocation(cab.getPickupLocation(), pickupLocation))
                            || (hasDrop && matchesLocation(cab.getDropLocation(), dropLocation))
                            || (hasPickup && matchesLocation(cab.getDropLocation(), pickupLocation))
                            || (hasDrop && matchesLocation(cab.getPickupLocation(), dropLocation)))
                .toList();

        return cityMatches;
    }

    public Cab updateCab(Long id, Cab updated) {
        Cab existing = getCabById(id);
        existing.setProvider(updated.getProvider());
        existing.setCabType(updated.getCabType());
        existing.setPickupLocation(updated.getPickupLocation());
        existing.setDropLocation(updated.getDropLocation());
        existing.setCapacity(updated.getCapacity());
        existing.setPrice(updated.getPrice());
        existing.setEstimatedDuration(updated.getEstimatedDuration());
        existing.setStatus(updated.getStatus());
        return cabRepository.save(existing);
    }

    public void deleteCab(Long id) {
        cabRepository.deleteById(id);
    }
}
