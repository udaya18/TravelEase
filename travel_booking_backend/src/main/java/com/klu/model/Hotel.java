package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "hotels", indexes = {
    @Index(name = "idx_hotels_location", columnList = "location")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long hotelId;

    @Column(nullable = false)
    private String hotelName;

    @Column(nullable = false)
    private String location;

    @Column(length = 1000)
    private String description;

    private String roomType;

    @Column(nullable = false)
    private double pricePerNight;

    private int availableRooms;

    private double rating;

    private String imageUrl;

    @Column(nullable = false)
    private String status; // AVAILABLE, FULL, CLOSED
}
