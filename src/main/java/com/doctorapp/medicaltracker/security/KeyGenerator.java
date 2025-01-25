package com.doctorapp.medicaltracker.security;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Base64;

public class KeyGenerator {
    public static void main(String[] args) {
        // Generate a secure key for HS512
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS512);

        // Encode the key to a base64 string
        String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());

        // Print the key
        System.out.println("Generated Key: " + base64Key);
    }
}
