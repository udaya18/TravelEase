package com.klu.service;

import com.klu.model.Hotel;
import com.klu.repository.HotelRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;

    public HotelService(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    public Hotel addHotel(Hotel hotel) {
        return hotelRepository.save(hotel);
    }

    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    public Hotel getHotelById(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with id: " + id));
    }

    private static final Map<String, List<String>> CITY_SYNONYMS = new HashMap<>();

    static {
        registerSynonyms("bengaluru", "bangalore", "blr");
        registerSynonyms("delhi", "new delhi", "del");
        registerSynonyms("mumbai", "bombay", "bom");
        registerSynonyms("chennai", "madras", "maa");
        registerSynonyms("kolkata", "calcutta", "ccu");
        registerSynonyms("kochi", "cochin", "cok");
        registerSynonyms("visakhapatnam", "vizag", "vtz");
        registerSynonyms("hyderabad", "hyd");
        registerSynonyms("vijayawada", "vga");
        registerSynonyms("pune", "pnq");
        registerSynonyms("goa", "goi");
        registerSynonyms("jaipur", "jai");
        registerSynonyms("ahmedabad", "amd");
    }

    private static void registerSynonyms(String... terms) {
        List<String> list = Arrays.asList(terms);
        for (String term : terms) {
            CITY_SYNONYMS.put(term.toLowerCase(), list);
        }
    }

    public List<Hotel> searchHotels(String location) {
        if (location == null || location.isBlank()) {
            return hotelRepository.findAll();
        }

        String raw = location.trim().toLowerCase();
        // Remove trailing comma separated state/country like "Hyderabad, Telangana"
        String cleanQuery = raw.split(",")[0].trim().replaceAll("\\s*\\([a-z0-9]+\\)", "").trim();

        Set<String> searchTerms = new HashSet<>();
        searchTerms.add(raw);
        searchTerms.add(cleanQuery);

        if (CITY_SYNONYMS.containsKey(cleanQuery)) {
            searchTerms.addAll(CITY_SYNONYMS.get(cleanQuery));
        }
        for (String key : CITY_SYNONYMS.keySet()) {
            if (raw.contains(key)) {
                searchTerms.addAll(CITY_SYNONYMS.get(key));
            }
        }

        return hotelRepository.findAll().stream()
                .filter(hotel -> {
                    if (hotel.getLocation() == null) return false;
                    String storedLoc = hotel.getLocation().toLowerCase();
                    for (String term : searchTerms) {
                        if (term.isBlank()) continue;
                        if (storedLoc.contains(term) || term.contains(storedLoc)) {
                            return true;
                        }
                    }
                    return false;
                })
                .toList();
    }

    public Hotel updateHotel(Long id, Hotel updated) {
        Hotel existing = getHotelById(id);
        existing.setHotelName(updated.getHotelName());
        existing.setLocation(updated.getLocation());
        existing.setDescription(updated.getDescription());
        existing.setRoomType(updated.getRoomType());
        existing.setPricePerNight(updated.getPricePerNight());
        existing.setAvailableRooms(updated.getAvailableRooms());
        existing.setRating(updated.getRating());
        existing.setImageUrl(updated.getImageUrl());
        existing.setStatus(updated.getStatus());
        return hotelRepository.save(existing);
    }

    public void deleteHotel(Long id) {
        hotelRepository.deleteById(id);
    }
}
