package com.klu.repository;

import com.klu.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {

    List<Hotel> findByLocationIgnoreCase(String location);

    List<Hotel> findByLocationContainingIgnoreCase(String location);

    boolean existsByHotelNameAndLocation(String hotelName, String location);
}
