package com.doctorapp.medicaltracker.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@Profile("dev")
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class PostgresCompatibilityInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(PostgresCompatibilityInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String databaseProductName = jdbcTemplate.execute((ConnectionCallback<String>) connection ->
                connection.getMetaData().getDatabaseProductName());

        if (databaseProductName == null || !databaseProductName.toLowerCase().contains("postgresql")) {
            return;
        }

        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF to_regclass('public.users') IS NOT NULL THEN
                        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
                        UPDATE public.users SET role = 'FRONT_DESK' WHERE role = 'STAFF';
                        ALTER TABLE public.users
                            ADD CONSTRAINT users_role_check
                            CHECK (role IN ('ADMIN', 'DOCTOR', 'FRONT_DESK', 'PATIENT'));
                    END IF;
                END $$;
                """);

        logger.info("PostgreSQL compatibility check completed for users.role constraint.");
    }
}
