package com.doctorapp.medicaltracker.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.config.LocalizationConfig;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;

@WebMvcTest(AdminUserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(LocalizationConfig.class)
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void listUsers_whenNoRoleFilter_returnsDoctorAndStaffUsers() throws Exception {
        User doctor = buildUser(10L, "doctor_a", "doctor_a@clinic.com", UserRole.DOCTOR);
        User staff = buildUser(11L, "staff_a", "staff_a@clinic.com", UserRole.STAFF);
        when(userRepository.findByRoleInOrderByRoleAscUsernameAsc(List.of(UserRole.DOCTOR, UserRole.STAFF)))
                .thenReturn(List.of(doctor, staff));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").value("doctor_a"))
                .andExpect(jsonPath("$[0].role").value("DOCTOR"))
                .andExpect(jsonPath("$[1].username").value("staff_a"))
                .andExpect(jsonPath("$[1].role").value("STAFF"));
    }

    @Test
    void listUsers_whenRoleFilterIsDoctor_returnsOnlyDoctorUsers() throws Exception {
        User doctor = buildUser(10L, "doctor_a", "doctor_a@clinic.com", UserRole.DOCTOR);
        when(userRepository.findByRoleOrderByUsernameAsc(UserRole.DOCTOR)).thenReturn(List.of(doctor));

        mockMvc.perform(get("/api/admin/users").param("role", "DOCTOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("doctor_a"))
                .andExpect(jsonPath("$[0].role").value("DOCTOR"));
    }

    @Test
    void listUsers_whenRoleFilterIsInvalid_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/admin/users").param("role", "PATIENT"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Role filter must be DOCTOR, STAFF, or ALL"));
    }

    @Test
    void listUsers_whenRoleFilterIsInvalid_andFrenchLocale_returnsFrenchMessage() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                .param("role", "ADMIN")
                .header("Accept-Language", "fr"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Le filtre de role doit etre DOCTOR, STAFF ou ALL"));
    }

    @Test
    void createUser_whenDoctorRoleAndValidPayload_returnsCreated() throws Exception {
        when(userRepository.existsByUsername("drhouse")).thenReturn(false);
        when(userRepository.existsByEmail("drhouse@clinic.com")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass1!")).thenReturn("encoded-value");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        String body = """
                {
                  "username": "drhouse",
                  "password": "SecurePass1!",
                  "email": "DRHOUSE@clinic.com",
                  "role": "DOCTOR"
                }
                """;

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.username").value("drhouse"))
                .andExpect(jsonPath("$.email").value("drhouse@clinic.com"))
                .andExpect(jsonPath("$.role").value("DOCTOR"))
                .andExpect(jsonPath("$.enabled").value(true));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(UserRole.DOCTOR, savedUser.getRole());
        org.junit.jupiter.api.Assertions.assertEquals("drhouse@clinic.com", savedUser.getEmail());
        org.junit.jupiter.api.Assertions.assertEquals("encoded-value", savedUser.getPassword());
    }

    @Test
    void createUser_whenAdminRoleRequested_returnsBadRequest() throws Exception {
        String body = """
                {
                  "username": "admin2",
                  "password": "SecurePass1!",
                  "email": "admin2@clinic.com",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Admin provisioning only supports DOCTOR and STAFF roles"));
    }

    @Test
    void createUser_whenAdminRoleRequested_andFrenchLocale_returnsFrenchMessage() throws Exception {
        String body = """
                {
                  "username": "admin2",
                  "password": "SecurePass1!",
                  "email": "admin2@clinic.com",
                  "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/admin/users")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("La creation admin prend en charge uniquement les roles DOCTOR et STAFF"));
    }

    private User buildUser(Long id, String username, String email, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }
}
