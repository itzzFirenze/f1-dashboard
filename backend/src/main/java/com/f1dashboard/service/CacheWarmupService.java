package com.f1dashboard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheWarmupService {

   private static final int CURRENT_SEASON = 2026;

   private final DashboardService dashboardService;
   private final DriverService driverService;
   private final ConstructorService constructorService;
   private final RaceService raceService;
   private final CircuitService circuitService;
   private final RecordsService recordsService;

   @EventListener(ApplicationReadyEvent.class)
   public void warmCommonCachesAfterStartup() {
      CompletableFuture.runAsync(this::warmCommonCaches);
   }

   public void warmCommonCaches() {
      try {
         log.info("Warming common read caches...");
         dashboardService.getDashboardData();
         driverService.getAllDrivers(CURRENT_SEASON);
         constructorService.getAllConstructors(CURRENT_SEASON);
         raceService.getRacesBySeason(CURRENT_SEASON);
         circuitService.getAllCircuits();
         recordsService.getHistoricalRecords(CURRENT_SEASON);
         log.info("Common read caches warmed.");
      } catch (Exception e) {
         log.warn("Cache warmup skipped: {}", e.getMessage());
      }
   }
}
