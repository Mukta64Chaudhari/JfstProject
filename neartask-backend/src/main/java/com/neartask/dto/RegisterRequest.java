package com.neartask.dto;
import java.util.List;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String role;
    private String skill;
    private List<String> skills;
}