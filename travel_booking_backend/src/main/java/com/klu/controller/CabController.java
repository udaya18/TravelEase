package com.klu.controller;

import com.klu.model.Cab;
import com.klu.service.CabService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cabs")
@Tag(name = "Cabs", description = "Cab search and management APIs")
public class CabController {

    private final CabService cabService;

    public CabController(CabService cabService) {
        this.cabService = cabService;
    }

    @Operation(summary = "Add a new cab (Admin)")
    @PostMapping
    public ResponseEntity<Cab> addCab(@RequestBody Cab cab) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cabService.addCab(cab));
    }

    @Operation(summary = "Get all cabs")
    @GetMapping
    public ResponseEntity<List<Cab>> getAllCabs() {
        return ResponseEntity.ok(cabService.getAllCabs());
    }

    @Operation(summary = "Get cab by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Cab> getCabById(@PathVariable Long id) {
        return ResponseEntity.ok(cabService.getCabById(id));
    }

    @Operation(summary = "Search cabs by pickup and drop location")
    @GetMapping("/search")
    public ResponseEntity<List<Cab>> searchCabs(
            @RequestParam(required = false) String pickupLocation,
            @RequestParam(required = false) String dropLocation,
            @RequestParam(required = false) String pickup,
            @RequestParam(required = false) String drop) {
        String p = (pickupLocation != null && !pickupLocation.isBlank()) ? pickupLocation : pickup;
        String d = (dropLocation != null && !dropLocation.isBlank()) ? dropLocation : drop;
        return ResponseEntity.ok(cabService.searchCabs(p, d));
    }

    @Operation(summary = "Update a cab (Admin)")
    @PutMapping("/{id}")
    public ResponseEntity<Cab> updateCab(@PathVariable Long id, @RequestBody Cab cab) {
        return ResponseEntity.ok(cabService.updateCab(id, cab));
    }

    @Operation(summary = "Delete a cab (Admin)")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCab(@PathVariable Long id) {
        cabService.deleteCab(id);
        return ResponseEntity.ok("Cab deleted successfully");
    }
}
