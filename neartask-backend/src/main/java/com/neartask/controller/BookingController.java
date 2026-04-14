package com.neartask.controller;

import com.neartask.model.*;
import com.neartask.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingRepository bookingRepo;
    private final TaskRepository taskRepo;
    private final UserRepository userRepo;

    @PostMapping("/accept")
    public ResponseEntity<?> acceptTask(@RequestParam Long taskId,
                                        @RequestParam Long workerId) {
        try {
            Task task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

            User worker = userRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

            if (!task.getStatus().equals("OPEN")) {
                return ResponseEntity.badRequest().body("Task is no longer available");
            }

            Booking booking = Booking.builder()
                .task(task)
                .worker(worker)
                .status("ACCEPTED")
                .acceptedAt(LocalDateTime.now())
                .build();

            task.setStatus("ASSIGNED");
            task.setAssignedTo(worker);
            taskRepo.save(task);

            return ResponseEntity.ok(bookingRepo.save(booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

            booking.setStatus("COMPLETED");
            booking.setCompletedAt(LocalDateTime.now());

            Task task = booking.getTask();
            task.setStatus("COMPLETED");
            taskRepo.save(task);

            return ResponseEntity.ok(bookingRepo.save(booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<Booking>> getWorkerBookings(@PathVariable Long workerId) {
        return ResponseEntity.ok(bookingRepo.findByWorkerId(workerId));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<?> getTaskBooking(@PathVariable Long taskId) {
        return bookingRepo.findByTaskId(taskId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}