package com.doctorapp.medicaltracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.security.Key;
import java.util.Date;
import io.jsonwebtoken.security.Keys;

import org.springframework.security.core.Authentication;
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

    // Convert the secret into a Key object
    private Key getSigningKey() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret cannot be null or empty");
        }
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return Jwts.builder()
                .setSubject(userDetails.getUsername()) // Set the subject (username)
                .setIssuedAt(new Date()) // Set the issued-at time
                .setExpiration(new Date(System.currentTimeMillis() + expiration)) // Set the expiration time
                .signWith(getSigningKey(), SignatureAlgorithm.HS512) // Sign the token with the key and algorithm
                .compact(); // Compact the token into a string
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey()) // Use the Key object for validation
                    .build()
                    .parseClaimsJws(token); // Parse and validate the token
            return true;
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage()); // Log the exception
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // Use the Key object for parsing
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject(); // Extract the subject (username) from the token
    }
}
