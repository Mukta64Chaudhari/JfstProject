package com.neartask.controller;

import com.neartask.model.User;
import com.neartask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    public User getUser(@PathVariable Long id) {
        return userRepo.findById(id).orElseThrow();
    }

    @GetMapping("/nearby")
    public List<User> getNearbyWorkers(@RequestParam double lat,
                                        @RequestParam double lng,
                                        @RequestParam(defaultValue = "10") double radiusKm) {
        return userRepo.findByRoleAndAvailableTrue("WORKER")
            .stream()
            .filter(w -> w.getLatitude() != null && w.getLongitude() != null)
            .filter(w -> haversine(lat, lng, w.getLatitude(), w.getLongitude()) <= radiusKm)
            .collect(Collectors.toList());
    }

    @PutMapping("/{id}/location")
    public User updateLocation(@PathVariable Long id,
                                @RequestParam double lat,
                                @RequestParam double lng) {
        User user = userRepo.findById(id).orElseThrow();
        user.setLatitude(lat);
        user.setLongitude(lng);
        return userRepo.save(user);
    }

    @PutMapping("/{id}/availability")
    public User toggleAvailability(@PathVariable Long id,
                                    @RequestParam boolean available) {
        User user = userRepo.findById(id).orElseThrow();
        user.setAvailable(available);
        return userRepo.save(user);
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