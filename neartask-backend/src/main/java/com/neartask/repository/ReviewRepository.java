package com.neartask.repository;

import com.neartask.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByWorkerId(Long workerId);
    Optional<Review> findFirstByTaskIdAndWorkerIdOrderByCreatedAtDesc(Long taskId, Long workerId);
}