package com.neartask.repository;

import com.neartask.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByWorkerId(Long workerId);
    Optional<Booking> findByTaskId(Long taskId);
    List<Booking> findByWorkerIdAndStatus(Long workerId, String status);
}