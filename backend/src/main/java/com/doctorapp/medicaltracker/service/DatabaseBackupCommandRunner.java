package com.doctorapp.medicaltracker.service;

import java.nio.file.Path;

import com.doctorapp.medicaltracker.service.impl.PostgresConnectionDetails;

public interface DatabaseBackupCommandRunner {

    void dump(PostgresConnectionDetails connectionDetails, String username, String password, Path outputFile);

    void restore(PostgresConnectionDetails connectionDetails, String username, String password, Path inputFile);
}
