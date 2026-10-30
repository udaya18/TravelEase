package com.klu.service;

import com.klu.dto.AuthResponse;
import com.klu.dto.SigninRequest;
import com.klu.dto.SignupRequest;
import com.klu.model.Role;
import com.klu.model.User;
import com.klu.repository.UserRepository;
import com.klu.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       BCryptPasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // ── Signup ──────────────────────────────────────────────────────────────
    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String normalizedEmail = email.toLowerCase();
        if (userRepository.existsByEmail(email) || userRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("Email already registered: " + email);
        }

        User user = new User();
        String nameToSet = request.getName();
        if (nameToSet == null || nameToSet.trim().isEmpty()) {
            nameToSet = "Traveler";
        }
        user.setName(nameToSet.trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Public signup must strictly assign USER role to prevent unauthorized ADMIN creation
        user.setRole(Role.USER);

        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getEmail(), saved.getRole().name(), saved.getUserId());

        return new AuthResponse(
                saved.getUserId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                token,
                "Signup successful"
        );
    }

    // ── Signin ──────────────────────────────────────────────────────────────
    public AuthResponse signin(SigninRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String normalizedEmail = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .or(() -> userRepository.findByEmailIgnoreCase(normalizedEmail))
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());

        return new AuthResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                token,
                "Signin successful"
        );
    }

    // ── Admin helpers ────────────────────────────────────────────────────────
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    public User getUserByEmail(String email) {
        String trimmed = email != null ? email.trim() : "";
        String lower = trimmed.toLowerCase();
        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(trimmed))
                .or(() -> userRepository.findByEmail(lower))
                .or(() -> userRepository.findByEmailIgnoreCase(lower))
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }
}
