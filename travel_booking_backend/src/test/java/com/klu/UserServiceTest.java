package com.klu;

import com.klu.dto.AuthResponse;
import com.klu.dto.SigninRequest;
import com.klu.dto.SignupRequest;
import com.klu.model.Role;
import com.klu.model.User;
import com.klu.repository.UserRepository;
import com.klu.security.JwtService;
import com.klu.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSignupSuccess() {
        SignupRequest request = new SignupRequest();
        request.setFullName("Rahul Verma");
        request.setEmail("rahul@example.com");
        request.setPassword("Password123");

        User savedUser = new User(1L, "Rahul Verma", "rahul@example.com", "encodedPassword", Role.USER);

        when(userRepository.existsByEmail("rahul@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken("rahul@example.com", "USER", 1L)).thenReturn("mock.jwt.token");

        AuthResponse response = userService.signup(request);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals("Rahul Verma", response.getName());
        assertEquals(Role.USER, response.getRole());
        assertEquals("mock.jwt.token", response.getToken());
    }

    @Test
    void testSignup_AlwaysEnforcesRoleUser_CannotEscalateToAdmin() {
        SignupRequest request = new SignupRequest();
        request.setFullName("Hacker User");
        request.setEmail("hacker@example.com");
        request.setPassword("Password123");

        when(userRepository.existsByEmail("hacker@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPassword");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        User savedUser = new User(2L, "Hacker User", "hacker@example.com", "encodedPassword", Role.USER);
        when(userRepository.save(userCaptor.capture())).thenReturn(savedUser);
        when(jwtService.generateToken("hacker@example.com", "USER", 2L)).thenReturn("mock.jwt.token");

        AuthResponse response = userService.signup(request);

        assertEquals(Role.USER, userCaptor.getValue().getRole());
        assertEquals(Role.USER, response.getRole());
    }

    @Test
    void testSignup_ExistingEmail_Throws() {
        SignupRequest request = new SignupRequest();
        request.setEmail("existing@example.com");
        request.setPassword("Password123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.signup(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testSigninSuccess() {
        SigninRequest request = new SigninRequest();
        request.setEmail("rahul@example.com");
        request.setPassword("Password123");

        User existingUser = new User(1L, "Rahul Verma", "rahul@example.com", "$2a$10$encoded", Role.USER);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("Password123", "$2a$10$encoded")).thenReturn(true);
        when(jwtService.generateToken("rahul@example.com", "USER", 1L)).thenReturn("mock.jwt.token");

        AuthResponse response = userService.signin(request);

        assertNotNull(response);
        assertEquals("Rahul Verma", response.getName());
        assertEquals("mock.jwt.token", response.getToken());
    }

    @Test
    void testSignin_InvalidPassword_Throws() {
        SigninRequest request = new SigninRequest();
        request.setEmail("rahul@example.com");
        request.setPassword("WrongPassword");

        User existingUser = new User(1L, "Rahul Verma", "rahul@example.com", "$2a$10$encoded", Role.USER);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$encoded")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> userService.signin(request));
    }
}
