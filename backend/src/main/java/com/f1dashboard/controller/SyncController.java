package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.service.CacheWarmupService;
import com.f1dashboard.service.DataSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Tag(name = "Sync", description = "Manual data synchronization endpoints")
public class SyncController {

   private final DataSyncService dataSyncService;
   private final CacheWarmupService cacheWarmupService;

   @Value("${sync.api-key:}")
   private String syncApiKey;

   private boolean isAuthorized(String headerKey) {
      if (syncApiKey == null || syncApiKey.isBlank()) {
         log.warn("SYNC_API_KEY is not set. Sync endpoints are unprotected. Set SYNC_API_KEY in production.");
         return true;
      }
      return syncApiKey.equals(headerKey);
   }

   @PostMapping
   @Operation(summary = "Manually trigger 2026 season data sync", description = "Fetches latest driver standings, constructor standings, and race results from external APIs.")
   public ResponseEntity<ApiResponse<String>> triggerSync(
         @RequestHeader(value = "X-Sync-Key", required = false) String apiKeyHeader) {
      if (!isAuthorized(apiKeyHeader)) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
               .body(ApiResponse.error("Unauthorized: invalid or missing sync API key."));
      }

      try {
         dataSyncService.syncRaceCalendar();
         dataSyncService.syncDriverStandings();
         dataSyncService.syncConstructorStandings();
         dataSyncService.syncRaceResults();
         dataSyncService.syncSprintResults();
         dataSyncService.syncQualifyingResults();
         dataSyncService.syncSprintQualifyingResults();
         dataSyncService.updateRaceStatusesByDate();
         dataSyncService.clearReadCaches();
         cacheWarmupService.warmCommonCaches();
         return ResponseEntity.ok(
               ApiResponse.success("Synchronization successful! Live 2026 standings, calendar, and results updated."));
      } catch (Exception e) {
         log.error("Failed to sync data", e);
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
               .body(ApiResponse.error("Failed to sync data. Please check server logs."));
      }
   }

   @PostMapping("/backfill/{season}")
   @Operation(summary = "Backfill historical race/qualifying/sprint results for a past season")
   public ResponseEntity<ApiResponse<String>> triggerBackfill(
         @PathVariable Integer season,
         @RequestHeader(value = "X-Sync-Key", required = false) String apiKeyHeader) {
      if (!isAuthorized(apiKeyHeader)) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
               .body(ApiResponse.error("Unauthorized: invalid or missing sync API key."));
      }

      try {
         dataSyncService.backfillSeason(season);
         return ResponseEntity.ok(ApiResponse.success("Backfill successful for season " + season));
      } catch (Exception e) {
         log.error("Failed to backfill season {}", season, e);
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
               .body(ApiResponse.error("Failed to backfill season " + season + ". Please check server logs."));
      }
   }
}
