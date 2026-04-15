package com.doctorapp.medicaltracker.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.UserRepository;

@Component
public class BootstrapAdminInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(BootstrapAdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String username;
    private final String email;
    private final String password;

    public BootstrapAdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin.enabled:false}") boolean enabled,
            @Value("${app.bootstrap.admin.username:}") String username,
            @Value("${app.bootstrap.admin.email:}") String email,
            @Value("${app.bootstrap.admin.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        if (userRepository.existsByRole(UserRole.ADMIN)) {
            logger.info("Bootstrap admin skipped: admin account already exists.");
            return;
        }

        String normalizedUsername = normalizeRequired(username, "app.bootstrap.admin.username");
        String normalizedEmail = normalizeRequired(email, "app.bootstrap.admin.email").toLowerCase();
        String rawPassword = normalizeRequired(password, "app.bootstrap.admin.password");

        if (rawPassword.length() < 8) {
            throw new IllegalStateException("Bootstrap admin password must be at least 8 characters.");
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalStateException("Bootstrap admin username already exists: " + normalizedUsername);
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("Bootstrap admin email already exists: " + normalizedEmail);
        }

        User admin = new User();
        admin.setUsername(normalizedUsername);
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(rawPassword));
        admin.setRole(UserRole.ADMIN);
        admin.setEnabled(true);

        userRepository.save(admin);
        logger.info("Bootstrap admin account created: {}", normalizedUsername);
    }

    private String normalizeRequired(String value, String propertyName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalStateException("Missing required property: " + propertyName);
        }
        return normalized;
    }
}
