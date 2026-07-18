package com.f1dashboard.config;

import com.f1dashboard.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Clean data initializer that triggers live data sync on startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DataSyncService dataSyncService;

    @Override
    public void run(String... args) {
        log.info("Database loaded. Performing initial live API sync...");
        try {
            dataSyncService.syncRaceCalendar(); // Pull race calendar
            dataSyncService.syncConstructorStandings(); // Pull constructor standings
            dataSyncService.syncDriverStandings(); // Pull driver standings
            dataSyncService.syncRaceResults(); // Pull race results (also updates podiums)
            dataSyncService.syncSprintResults(); // Pull sprint results
            dataSyncService.syncQualifyingResults(); // Pull qualifying results
            dataSyncService.updateRaceStatusesByDate(); // Reconcile statuses
            log.info("Initial sync completed successfully. All data is dynamically loaded.");
        } catch (Exception e) {
            log.error("Failed to run initial sync: {}", e.getMessage(), e);
        }
    }
}
