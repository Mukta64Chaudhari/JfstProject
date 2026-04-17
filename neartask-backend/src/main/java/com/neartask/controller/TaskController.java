package com.neartask.controller;

import com.neartask.model.*;
import com.neartask.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskRepository taskRepo;
    private final UserRepository userRepo;

    @GetMapping
    public List<Task> getAllOpenTasks() {
        return taskRepo.findByStatus("OPEN");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable Long id) {
        return taskRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my/{userId}")
    public List<Task> getMyTasks(@PathVariable Long userId) {
        return taskRepo.findByPostedById(userId);
    }

    @GetMapping("/category/{category}")
    public List<Task> getByCategory(@PathVariable String category) {
        return taskRepo.findByCategory(category);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        task.setStatus("OPEN");
        return ResponseEntity.ok(taskRepo.save(task));
    }

    @PutMapping("/{id}/assign/{workerId}")
    public ResponseEntity<Task> assignWorker(@PathVariable Long id,
                                              @PathVariable Long workerId) {
        Task task = taskRepo.findById(id).orElseThrow();
        User worker = userRepo.findById(workerId).orElseThrow();
        task.setAssignedTo(worker);
        task.setStatus("ASSIGNED");
        return ResponseEntity.ok(taskRepo.save(task));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Task> completeTask(@PathVariable Long id) {
        Task task = taskRepo.findById(id).orElseThrow();
        task.setStatus("COMPLETED");
        return ResponseEntity.ok(taskRepo.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        taskRepo.deleteById(id);
        return ResponseEntity.ok("Task deleted");
    }
}