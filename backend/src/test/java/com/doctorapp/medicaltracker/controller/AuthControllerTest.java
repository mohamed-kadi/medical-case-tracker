package com.doctorapp.medicaltracker.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.config.LocalizationConfig;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(LocalizationConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void login_whenValidCredentials_returnsJwtToken() throws Exception {
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token-value");

        String body = """
                {
                  "username": "doctor",
                  "password": "SecurePass1!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-value"));
    }

    @Test
    void register_whenPrivilegedRoleRequested_returnsForbidden() throws Exception {
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@clinic.com")).thenReturn(false);

        String body = """
                {
                  "username": "admin",
                  "password": "SecurePass1!",
                  "email": "admin@clinic.com",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isForbidden())
                .andExpect(content().string("Public registration cannot assign privileged roles"));
    }

    @Test
    void register_whenPrivilegedRoleRequested_andFrenchLocale_returnsFrenchMessage() throws Exception {
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@clinic.com")).thenReturn(false);

        String body = """
                {
                  "username": "admin",
                  "password": "SecurePass1!",
                  "email": "admin@clinic.com",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isForbidden())
                .andExpect(content().string("L'inscription publique ne peut pas attribuer des roles privilegies"));
    }

    @Test
    void register_whenRoleNotProvided_defaultsToPatientAndSavesNormalizedFields() throws Exception {
        when(userRepository.existsByUsername("doctor")).thenReturn(false);
        when(userRepository.existsByEmail("doctor@clinic.com")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass1!")).thenReturn("encoded-value");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String body = """
                {
                  "username": "doctor",
                  "password": "SecurePass1!",
                  "email": "DOCTOR@clinic.com"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(content().string("User registered successfully"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals("doctor", savedUser.getUsername());
        org.junit.jupiter.api.Assertions.assertEquals("doctor@clinic.com", savedUser.getEmail());
        org.junit.jupiter.api.Assertions.assertEquals("encoded-value", savedUser.getPassword());
        org.junit.jupiter.api.Assertions.assertEquals(com.doctorapp.medicaltracker.model.UserRole.PATIENT, savedUser.getRole());
    }

    @Test
    void login_whenMissingUsername_returnsBadRequest() throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of("password", "SecurePass1!"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }
}
