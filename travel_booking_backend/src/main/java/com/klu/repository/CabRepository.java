package com.klu.repository;

import com.klu.model.Cab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CabRepository extends JpaRepository<Cab, Long> {

    List<Cab> findByPickupLocationIgnoreCaseAndDropLocationIgnoreCase(
            String pickupLocation, String dropLocation);

    List<Cab> findByPickupLocationIgnoreCase(String pickupLocation);

    List<Cab> findByPickupLocationContainingIgnoreCaseAndDropLocationContainingIgnoreCase(
            String pickupLocation, String dropLocation);

    List<Cab> findByPickupLocationContainingIgnoreCase(String pickupLocation);

    List<Cab> findByDropLocationContainingIgnoreCase(String dropLocation);

    boolean existsByProviderAndCabTypeAndPickupLocationAndDropLocation(
            String provider, String cabType, String pickupLocation, String dropLocation);
}
