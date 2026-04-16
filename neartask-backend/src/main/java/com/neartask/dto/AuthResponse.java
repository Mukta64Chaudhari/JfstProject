package com.neartask.dto;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String name;
    private Long userId;
    private String skill;
    private List<String> skills;
}