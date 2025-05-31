package com.zomato.opspro.config;

import com.zomato.opspro.model.User;
import com.zomato.opspro.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ApplicationInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(ApplicationInitializer.class);

    @Autowired
    private UserService userService;

    @Override
    public void run(String... args) {
        logger.info("Initializing partner users...");
        initializePartnerUsers();
        logger.info("Partner users initialized successfully");
    }

    private void initializePartnerUsers() {
        // Create partner users only
        String[][] partners = {
            {"john", "password123"},
            {"jane", "password123"},
            {"mike", "password123"}
        };
        for (String[] partner : partners) {
            if (userService.findByUsername(partner[0]).isEmpty()) {
                userService.createUser(partner[0], partner[1], User.Role.PARTNER);
            }
        }
    }
} 