package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.service.CacheWarmupService;
import com.f1dashboard.service.DataSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Tag(name = "Sync", description = "Manual data synchronization endpoints")
public class SyncController {

   private final DataSyncService dataSyncService;
   private final CacheWarmupService cacheWarmupService;

   @PostMapping
   @Operation(summary = "Manually trigger 2026 season data sync", description = "Fetches latest driver standings, constructor standings, and race results from external APIs.")
   public ResponseEntity<ApiResponse<String>> triggerSync() {
      try {
         dataSyncService.syncRaceCalendar();
         dataSyncService.syncDriverStandings();
         dataSyncService.syncConstructorStandings();
         dataSyncService.syncRaceResults();
         dataSyncService.syncSprintResults();
         dataSyncService.syncQualifyingResults();
         dataSyncService.updateRaceStatusesByDate();
         dataSyncService.clearReadCaches();
         cacheWarmupService.warmCommonCaches();
         return ResponseEntity.ok(
               ApiResponse.success("Synchronization successful! Live 2026 standings, calendar, and results updated."));
      } catch (Exception e) {
         return ResponseEntity.status(500).body(ApiResponse.error("Failed to sync data: " + e.getMessage()));
      }
   }

   @PostMapping("/backfill/{season}")
   @Operation(summary = "Backfill historical race/qualifying/sprint results for a past season")
   public ResponseEntity<ApiResponse<String>> triggerBackfill(@PathVariable Integer season) {
      try {
         dataSyncService.backfillSeason(season);
         return ResponseEntity.ok(ApiResponse.success("Backfill successful for season " + season));
      } catch (Exception e) {
         return ResponseEntity.status(500)
               .body(ApiResponse.error("Failed to backfill season " + season + ": " + e.getMessage()));
      }
   }
}
