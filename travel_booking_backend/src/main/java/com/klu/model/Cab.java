package com.klu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cabs", indexes = {
    @Index(name = "idx_cabs_pickup_drop", columnList = "pickupLocation, dropLocation")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cabId;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String cabType;

    @Column(nullable = false)
    private String pickupLocation;

    @Column(nullable = false)
    private String dropLocation;

    private int capacity;

    @Column(nullable = false)
    private double price;

    private String estimatedDuration;

    @Column(nullable = false)
    private String status; // AVAILABLE, BOOKED, UNAVAILABLE
}
