package com.klu.repository;

import com.klu.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    List<Flight> findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCase(String source, String destination);

    List<Flight> findBySourceContainingIgnoreCase(String source);

    List<Flight> findByDestinationContainingIgnoreCase(String destination);

    boolean existsByFlightNumber(String flightNumber);

    Optional<Flight> findByFlightNumber(String flightNumber);
}
