package com.neartask.controller;

import com.neartask.model.*;
import com.neartask.repository.*;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepo;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review) {
        try {
            return ResponseEntity.ok(reviewRepo.save(review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<Review>> getWorkerReviews(@PathVariable Long workerId) {
        return ResponseEntity.ok(reviewRepo.findByWorkerId(workerId));
    }

    @GetMapping("/task/{taskId}/worker/{workerId}")
    public ResponseEntity<?> getTaskWorkerReview(@PathVariable Long taskId, @PathVariable Long workerId) {
        try {
            Review review = reviewRepo.findByWorkerId(workerId).stream()
                .filter(r -> r.getTask() != null && Objects.equals(r.getTask().getId(), taskId))
                .max(Comparator.comparing(Review::getCreatedAt))
                .orElse(null);
            // Return 200 with null instead of 5xx so frontend can safely render "not reviewed" state.
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    @GetMapping("/worker/{workerId}/rating")
    public ResponseEntity<?> getWorkerRating(@PathVariable Long workerId) {
        try {
            List<Review> reviews = reviewRepo.findByWorkerId(workerId);
            if (reviews.isEmpty()) {
                return ResponseEntity.ok(new Object() {
                    public double rating = 0.0;
                    public int count = 0;
                });
            }

            double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

            return ResponseEntity.ok(new Object() {
                public double rating = avg;
                public int count = reviews.size();
            });
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
