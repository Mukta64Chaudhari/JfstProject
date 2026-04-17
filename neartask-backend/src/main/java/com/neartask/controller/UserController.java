package com.neartask.controller;

import com.neartask.model.User;
import com.neartask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepo;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<User>> getNearbyWorkers(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm) {

        List<User> workers = userRepo.findByRoleAndAvailableTrue("WORKER")
            .stream()
            .filter(w -> w.getLatitude() != null && w.getLongitude() != null)
            .filter(w -> haversine(lat, lng, w.getLatitude(), w.getLongitude()) <= radiusKm)
            .collect(Collectors.toList());

        return ResponseEntity.ok(workers);
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long id,
                                             @RequestParam double lat,
                                             @RequestParam double lng) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            user.setLatitude(lat);
            user.setLongitude(lng);
            return ResponseEntity.ok(userRepo.save(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable Long id,
                                                 @RequestParam boolean available) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            user.setAvailable(available);
            return ResponseEntity.ok(userRepo.save(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}