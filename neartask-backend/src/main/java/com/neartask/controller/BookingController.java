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
    public ResponseEntity<Booking> acceptTask(@RequestParam Long taskId,
                                               @RequestParam Long workerId) {
        Task task = taskRepo.findById(taskId).orElseThrow();
        User worker = userRepo.findById(workerId).orElseThrow();

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
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Booking> completeBooking(@PathVariable Long id) {
        Booking booking = bookingRepo.findById(id).orElseThrow();
        booking.setStatus("COMPLETED");
        booking.setCompletedAt(LocalDateTime.now());

        Task task = booking.getTask();
        task.setStatus("COMPLETED");
        taskRepo.save(task);

        return ResponseEntity.ok(bookingRepo.save(booking));
    }

    @GetMapping("/worker/{workerId}")
    public List<Booking> getWorkerBookings(@PathVariable Long workerId) {
        return bookingRepo.findByWorkerId(workerId);
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<Booking> getTaskBooking(@PathVariable Long taskId) {
        return bookingRepo.findByTaskId(taskId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}