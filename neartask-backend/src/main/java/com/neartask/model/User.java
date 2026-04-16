package com.neartask.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String phone;
    private String role;        // "CUSTOMER" or "WORKER"
    private String skill;       // worker service category
    private Double latitude;
    private Double longitude;
    private boolean available = true;
    private Double rating = 0.0;
}