package com.doctorapp.medicaltracker.controller;

import java.util.Locale;

import com.doctorapp.medicaltracker.dto.LoginRequest;
import com.doctorapp.medicaltracker.dto.LoginResponse;
import com.doctorapp.medicaltracker.dto.RegisterRequest;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;

import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;

import jakarta.validation.Valid;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;

    private final JwtTokenProvider jwtTokenProvider;

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final MessageSource messageSource;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(), loginRequest.getPassword()));

        String token = jwtTokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new LoginResponse(token));

    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String normalizedUsername = registerRequest.getUsername().trim();
        String normalizedEmail = registerRequest.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.badRequest().body(message("auth.register.username.exists"));
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(message("auth.register.email.exists"));
        }

        UserRole requestedRole = registerRequest.getRole() == null ? UserRole.PATIENT : registerRequest.getRole();
        if (requestedRole != UserRole.PATIENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(message("auth.register.role.forbidden"));
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmail(normalizedEmail);
        user.setRole(requestedRole);

        userRepository.save(user);
        return ResponseEntity.ok(message("auth.register.success"));
        
    } 

    private String message(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(key, args, locale);
    }

}
