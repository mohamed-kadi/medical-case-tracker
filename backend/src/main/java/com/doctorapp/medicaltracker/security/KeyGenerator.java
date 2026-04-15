package com.doctorapp.medicaltracker.security;

import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;
import java.util.Base64;

public class KeyGenerator {
    public static void main(String[] args) {
        // Generate a secure key for HS512 using the JJWT 0.12+ API
        SecretKey key = Jwts.SIG.HS512.key().build();

        // Encode the key to a base64 string
        String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());

        // Print the key
        System.out.println("Generated Key: " + base64Key);
    }
}
