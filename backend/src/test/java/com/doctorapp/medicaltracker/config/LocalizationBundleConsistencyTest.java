package com.doctorapp.medicaltracker.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class LocalizationBundleConsistencyTest {

    @Test
    void englishAndFrenchBundlesShouldExposeSameKeys() throws IOException {
        Properties en = loadProperties("i18n/messages_en.properties");
        Properties fr = loadProperties("i18n/messages_fr.properties");

        Set<String> englishKeys = new TreeSet<>(en.stringPropertyNames());
        Set<String> frenchKeys = new TreeSet<>(fr.stringPropertyNames());

        assertEquals(englishKeys, frenchKeys,
                "Message bundle keys must stay synchronized between English and French.");
    }

    private Properties loadProperties(String path) throws IOException {
        Properties properties = new Properties();
        ClassPathResource resource = new ClassPathResource(path);
        try (InputStream inputStream = resource.getInputStream()) {
            properties.load(inputStream);
        }
        return properties;
    }
}
