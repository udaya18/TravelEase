package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "flights", indexes = {
    @Index(name = "idx_flights_source_dest", columnList = "source, destination")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long flightId;

    @Column(nullable = false)
    private String airline;

    @Column(nullable = false, unique = true)
    private String flightNumber;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String departureTime;

    @Column(nullable = false)
    private String arrivalTime;

    private String duration;

    private int stops;

    @Column(nullable = false)
    private double price;

    private int availableSeats;

    private double rating;

    @Column(nullable = false)
    private String status; // AVAILABLE, FULL, CANCELLED
}
