package com.neartask.controller;

import com.neartask.config.JwtUtil;
import com.neartask.dto.*;
import com.neartask.model.User;
import com.neartask.repository.UserRepository;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent())
            return ResponseEntity.badRequest().body("Email already registered");

        List<String> normalizedSkills = normalizeSkills(req);

        User user = User.builder()
            .name(req.getName())
            .email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .phone(req.getPhone())
            .role(req.getRole())
            // Keep worker skills in existing column as CSV to avoid schema migration.
            .skill(String.join(",", normalizedSkills))
            .available(true)
            .build();

        User saved = userRepo.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());
        List<String> savedSkills = parseUserSkills(saved.getSkill());
        String legacySkill = savedSkills.isEmpty() ? "" : savedSkills.get(0);
        return ResponseEntity.ok(new AuthResponse(token, saved.getRole(), saved.getName(), saved.getId(), legacySkill, savedSkills));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
            .orElse(null);

        if (user == null || !encoder.matches(req.getPassword(), user.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");

        String token = jwtUtil.generateToken(user.getEmail());
        List<String> userSkills = parseUserSkills(user.getSkill());
        String legacySkill = userSkills.isEmpty() ? "" : userSkills.get(0);
        return ResponseEntity.ok(new AuthResponse(token, user.getRole(), user.getName(), user.getId(), legacySkill, userSkills));
    }

    private List<String> normalizeSkills(RegisterRequest req) {
        if (req.getSkills() != null && !req.getSkills().isEmpty()) {
            return req.getSkills().stream()
                .filter(s -> s != null && !s.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
        }

        if (req.getSkill() != null && !req.getSkill().trim().isEmpty()) {
            return List.of(req.getSkill().trim());
        }

        return Collections.emptyList();
    }

    private List<String> parseUserSkills(String rawSkills) {
        if (rawSkills == null || rawSkills.trim().isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(rawSkills.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .distinct()
            .collect(Collectors.toList());
    }
}