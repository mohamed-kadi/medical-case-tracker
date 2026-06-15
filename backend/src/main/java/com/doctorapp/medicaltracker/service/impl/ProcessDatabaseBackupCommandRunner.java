package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.doctorapp.medicaltracker.exception.BackupOperationException;
import com.doctorapp.medicaltracker.service.DatabaseBackupCommandRunner;

@Component
public class ProcessDatabaseBackupCommandRunner implements DatabaseBackupCommandRunner {

    private static final long COMMAND_TIMEOUT_MINUTES = 10;

    private final String pgDumpCommand;
    private final String psqlCommand;

    public ProcessDatabaseBackupCommandRunner(
            @Value("${app.backup.pg-dump-command:pg_dump}") String pgDumpCommand,
            @Value("${app.backup.psql-command:psql}") String psqlCommand) {
        this.pgDumpCommand = pgDumpCommand;
        this.psqlCommand = psqlCommand;
    }

    @Override
    public void dump(PostgresConnectionDetails connectionDetails, String username, String password, Path outputFile) {
        List<String> command = new ArrayList<>(List.of(
                pgDumpCommand,
                "--host", connectionDetails.host(),
                "--port", String.valueOf(connectionDetails.port()),
                "--username", username,
                "--dbname", connectionDetails.databaseName(),
                "--format", "plain",
                "--no-owner",
                "--no-privileges",
                "--clean",
                "--if-exists",
                "--file", outputFile.toString()));
        run(command, password, "Database backup failed");
    }

    @Override
    public void restore(PostgresConnectionDetails connectionDetails, String username, String password, Path inputFile) {
        List<String> command = new ArrayList<>(List.of(
                psqlCommand,
                "--host", connectionDetails.host(),
                "--port", String.valueOf(connectionDetails.port()),
                "--username", username,
                "--dbname", connectionDetails.databaseName(),
                "--set", "ON_ERROR_STOP=1",
                "--file", inputFile.toString()));
        run(command, password, "Database restore failed");
    }

    private void run(List<String> command, String password, String failureMessage) {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        if (StringUtils.hasText(password)) {
            processBuilder.environment().put("PGPASSWORD", password);
        }

        try {
            Process process = processBuilder.start();
            CompletableFuture<String> outputReader = CompletableFuture.supplyAsync(() -> readProcessOutput(process));
            boolean completed = process.waitFor(COMMAND_TIMEOUT_MINUTES, TimeUnit.MINUTES);
            if (!completed) {
                process.destroyForcibly();
                outputReader.cancel(true);
                throw new BackupOperationException(failureMessage + ": command timed out");
            }
            String output = outputReader.join();
            if (process.exitValue() != 0) {
                throw new BackupOperationException(failureMessage + ": " + output.trim());
            }
        } catch (IOException ex) {
            throw new BackupOperationException(failureMessage + ": unable to start PostgreSQL tools", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BackupOperationException(failureMessage + ": command interrupted", ex);
        } catch (CompletionException ex) {
            throw new BackupOperationException(failureMessage + ": unable to read PostgreSQL tool output", ex);
        }
    }

    private String readProcessOutput(Process process) {
        try {
            return new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new CompletionException(ex);
        }
    }
}
