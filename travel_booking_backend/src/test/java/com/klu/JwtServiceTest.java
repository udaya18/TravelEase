package com.klu;

import com.klu.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Set a test Base64 secret (256 bits)
        ReflectionTestUtils.setField(jwtService, "secretKey", "dGhpc0lzQVN1cGVyU2VjcmV0S2V5Rm9yVHJhdmVsRWFzZUFwcGxpY2F0aW9uMjAyNg==");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86400000L);
    }

    @Test
    void testGenerateAndValidateToken() {
        String email = "testuser@example.com";
        String role = "USER";
        Long userId = 1L;

        String token = jwtService.generateToken(email, role, userId);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        assertTrue(jwtService.isTokenValid(token));
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(role, jwtService.extractRole(token));
        assertEquals(userId, jwtService.extractUserId(token));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtService.isTokenValid("invalid.token.structure"));
    }
}
