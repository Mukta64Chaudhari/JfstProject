package com.neartask.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne
    @JoinColumn(name = "worker_id")
    private User worker;

    private String status;      // ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
}