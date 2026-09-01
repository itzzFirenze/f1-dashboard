package com.f1dashboard.config;

import com.f1dashboard.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

   private final DataSyncService dataSyncService;

   @EventListener(ApplicationReadyEvent.class)
   public void onApplicationReady() {
      CompletableFuture.runAsync(() -> {
         log.info("Server is up and accepting traffic. Starting initial live API sync in background...");
         try {
            dataSyncService.syncRaceCalendar();
            dataSyncService.syncConstructorStandings();
            dataSyncService.syncDriverStandings();
            dataSyncService.syncRaceResults();
            dataSyncService.syncSprintResults();
            dataSyncService.syncQualifyingResults();
            dataSyncService.syncSprintQualifyingResults();
            dataSyncService.updateRaceStatusesByDate();
            dataSyncService.clearReadCaches();
            log.info("Initial background sync completed successfully. All data is dynamically loaded.");
         } catch (Exception e) {
            log.error("Failed to run initial background sync: {}", e.getMessage(), e);
         }
      });
   }
}