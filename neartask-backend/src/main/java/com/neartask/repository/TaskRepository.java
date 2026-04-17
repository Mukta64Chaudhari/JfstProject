package com.neartask.repository;

import com.neartask.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatus(String status);
    List<Task> findByPostedById(Long userId);
    List<Task> findByCategory(String category);
    List<Task> findByStatusAndCategory(String status, String category);
}