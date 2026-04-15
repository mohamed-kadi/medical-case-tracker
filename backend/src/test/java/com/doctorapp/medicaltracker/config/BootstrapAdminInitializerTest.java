package com.doctorapp.medicaltracker.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class BootstrapAdminInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void run_whenDisabled_shouldSkip() throws Exception {
        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(
                userRepository,
                passwordEncoder,
                false,
                "bootstrap-admin",
                "admin@clinic.com",
                "SecurePass1!");

        initializer.run(null);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void run_whenAdminAlreadyExists_shouldSkip() throws Exception {
        when(userRepository.existsByRole(UserRole.ADMIN)).thenReturn(true);

        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(
                userRepository,
                passwordEncoder,
                true,
                "bootstrap-admin",
                "admin@clinic.com",
                "SecurePass1!");

        initializer.run(null);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void run_whenMissingUsername_shouldFailFast() {
        when(userRepository.existsByRole(UserRole.ADMIN)).thenReturn(false);

        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(
                userRepository,
                passwordEncoder,
                true,
                " ",
                "admin@clinic.com",
                "SecurePass1!");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> initializer.run(null));
        assertEquals("Missing required property: app.bootstrap.admin.username", ex.getMessage());
    }

    @Test
    void run_whenEnabledAndValid_shouldCreateAdmin() throws Exception {
        when(userRepository.existsByRole(UserRole.ADMIN)).thenReturn(false);
        when(userRepository.existsByUsername("bootstrap-admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@clinic.com")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass1!")).thenReturn("encoded-value");

        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(
                userRepository,
                passwordEncoder,
                true,
                "bootstrap-admin",
                "admin@clinic.com",
                "SecurePass1!");

        initializer.run(null);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User saved = userCaptor.getValue();
        assertEquals("bootstrap-admin", saved.getUsername());
        assertEquals("admin@clinic.com", saved.getEmail());
        assertEquals(UserRole.ADMIN, saved.getRole());
        assertEquals("encoded-value", saved.getPassword());
    }
}
