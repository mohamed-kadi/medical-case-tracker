package com.doctorapp.medicaltracker.service.impl;

import java.net.URI;

import com.doctorapp.medicaltracker.exception.BackupOperationException;

public record PostgresConnectionDetails(String host, int port, String databaseName) {

    public static PostgresConnectionDetails fromJdbcUrl(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:postgresql:")) {
            throw new BackupOperationException("Backup requires a PostgreSQL JDBC URL");
        }

        String withoutPrefix = jdbcUrl.substring("jdbc:postgresql:".length());
        String withoutQuery = withoutPrefix.split("\\?", 2)[0];

        if (withoutQuery.startsWith("//")) {
            URI uri = URI.create("postgresql:" + withoutQuery);
            String databaseName = normalizeDatabaseName(uri.getPath());
            return new PostgresConnectionDetails(uri.getHost(), uri.getPort() > 0 ? uri.getPort() : 5432, databaseName);
        }

        String databaseName = withoutQuery.isBlank() ? "postgres" : withoutQuery;
        return new PostgresConnectionDetails("localhost", 5432, databaseName);
    }

    private static String normalizeDatabaseName(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            throw new BackupOperationException("PostgreSQL database name is missing from DB_URL");
        }

        return path.startsWith("/") ? path.substring(1) : path;
    }
}
