package com.doctorapp.medicaltracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import io.jsonwebtoken.security.Keys;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

@Service
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    // Convert the secret into a signing key
    private SecretKey getSigningKey() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret cannot be null or empty");
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse("PATIENT");

        return Jwts.builder()
                .subject(userDetails.getUsername()) // Set the subject (username)
                .claim("role", role)
                .issuedAt(new Date()) // Set the issued-at time
                .expiration(new Date(System.currentTimeMillis() + expiration)) // Set the expiration time
                .signWith(getSigningKey(), Jwts.SIG.HS512) // Sign the token with the key and algorithm
                .compact(); // Compact the token into a string
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey()) // Use the Key object for validation
                    .build()
                    .parseSignedClaims(token); // Parse and validate the token
            return true;
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage()); // Log the exception
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey()) // Use the Key object for parsing
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject(); // Extract the subject (username) from the token
    }
}
