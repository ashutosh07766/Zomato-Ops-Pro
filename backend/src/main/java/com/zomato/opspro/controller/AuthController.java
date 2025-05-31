package com.zomato.opspro.controller;

import com.zomato.opspro.model.User;
import com.zomato.opspro.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Login attempt for user: {}", loginRequest.getUsername());
            logger.debug("Login request received: username={}", loginRequest.getUsername());
            
            if (loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
                logger.error("Username or password is null");
                return ResponseEntity.badRequest().body("Username and password are required");
            }

            User user = userService.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> {
                    logger.error("User not found: {}", loginRequest.getUsername());
                    return new RuntimeException("User not found");
                });

            logger.debug("User found in database: id={}, username={}, role={}", 
                user.getId(), user.getUsername(), user.getRole());

            boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
            logger.debug("Password match result: {}", passwordMatches);

            if (!passwordMatches) {
                logger.error("Invalid password for user: {}", loginRequest.getUsername());
                return ResponseEntity.badRequest().body("Invalid credentials");
            }

            logger.info("Login successful for user: {}", loginRequest.getUsername());
            return ResponseEntity.ok(new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRole()
            ));
        } catch (Exception e) {
            logger.error("Login error: ", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Request and Response DTOs
    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginResponse {
        private Long id;
        private String username;
        private User.Role role;

        public LoginResponse(Long id, String username, User.Role role) {
            this.id = id;
            this.username = username;
            this.role = role;
        }

        public Long getId() {
            return id;
        }

        public String getUsername() {
            return username;
        }

        public User.Role getRole() {
            return role;
        }
    }
} 