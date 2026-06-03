package com.doctorapp.medicaltracker.controller;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.doctorapp.medicaltracker.dto.AdminCreateUserRequest;
import com.doctorapp.medicaltracker.dto.AdminUserResponse;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Set<UserRole> ALLOWED_PROVISION_ROLES = Set.of(UserRole.DOCTOR, UserRole.FRONT_DESK);
    private static final List<UserRole> INTERNAL_ROLES = List.of(UserRole.DOCTOR, UserRole.FRONT_DESK);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageSource messageSource;

    @GetMapping
    public ResponseEntity<?> listUsers(@RequestParam(name = "role", required = false, defaultValue = "ALL") String roleFilter) {
        String normalizedRoleFilter = roleFilter.trim().toUpperCase(Locale.ROOT);

        List<User> users;
        if ("ALL".equals(normalizedRoleFilter)) {
            users = userRepository.findByRoleInOrderByRoleAscUsernameAsc(INTERNAL_ROLES);
        } else {
            UserRole requestedRole;
            try {
                requestedRole = UserRole.valueOf(normalizedRoleFilter);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(message("admin.user.list.role.invalid"));
            }

            if (!ALLOWED_PROVISION_ROLES.contains(requestedRole)) {
                return ResponseEntity.badRequest().body(message("admin.user.list.role.invalid"));
            }

            users = userRepository.findByRoleOrderByUsernameAsc(requestedRole);
        }

        List<AdminUserResponse> response = users.stream().map(AdminUserResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        String normalizedUsername = request.getUsername().trim();
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (!ALLOWED_PROVISION_ROLES.contains(request.getRole())) {
            return ResponseEntity.badRequest().body(message("admin.user.create.role.invalid"));
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.badRequest().body(message("auth.register.username.exists"));
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(message("auth.register.email.exists"));
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setEnabled(true);

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(AdminUserResponse.from(saved));
    }

    private String message(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(key, args, locale);
    }
}
