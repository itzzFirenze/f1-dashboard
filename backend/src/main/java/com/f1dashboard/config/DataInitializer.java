package com.f1dashboard.config;

import com.f1dashboard.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

   private final DataSyncService dataSyncService;

   @Override
   public void run(String... args) {
      log.info("Database loaded. Performing initial live API sync...");
      try {
         dataSyncService.syncRaceCalendar();
         dataSyncService.syncConstructorStandings();
         dataSyncService.syncDriverStandings();
         dataSyncService.syncRaceResults();
         dataSyncService.syncSprintResults();
         dataSyncService.syncQualifyingResults();
         dataSyncService.syncSprintQualifyingResults();
         dataSyncService.updateRaceStatusesByDate();
         log.info("Initial sync completed successfully. All data is dynamically loaded.");
      } catch (Exception e) {
         log.error("Failed to run initial sync: {}", e.getMessage(), e);
      }
   }
}