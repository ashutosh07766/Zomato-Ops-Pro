package com.zomato.opspro.service;

import com.zomato.opspro.model.User;
import com.zomato.opspro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        logger.debug("Finding user by username: {}", username);
        Optional<User> user = userRepository.findByUsername(username);
        logger.debug("User found: {}", user.isPresent());
        return user;
    }

    public User createUser(String username, String password, User.Role role) {
        logger.info("Creating new user: {}", username);
        User user = new User();
        user.setUsername(username);
        String encodedPassword = passwordEncoder.encode(password);
        logger.debug("Encoded password for {}: {}", username, encodedPassword);
        user.setPassword(encodedPassword);
        user.setRole(role);
        User savedUser = userRepository.save(user);
        logger.info("User created successfully: {}", username);
        return savedUser;
    }

    public void initializeDefaultUsers() {
        logger.info("Starting default users initialization");
        
        // Create manager user
        Optional<User> existingManager = userRepository.findByUsername("manager");
        if (existingManager.isEmpty()) {
            logger.info("Creating manager user");
            User manager = createUser("manager", "manager123", User.Role.MANAGER);
            logger.info("Manager user created with ID: {}", manager.getId());
        } else {
            logger.info("Manager user already exists with ID: {}", existingManager.get().getId());
        }

        // Create partner user
        Optional<User> existingPartner = userRepository.findByUsername("partner");
        if (existingPartner.isEmpty()) {
            logger.info("Creating partner user");
            User partner = createUser("partner", "partner123", User.Role.PARTNER);
            logger.info("Partner user created with ID: {}", partner.getId());
        } else {
            logger.info("Partner user already exists with ID: {}", existingPartner.get().getId());
        }

        logger.info("Default users initialization completed");
    }
} 