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

   private boolean isAuthorized(String headerKey, jakarta.servlet.http.HttpServletRequest request) {
      // Always permit requests from localhost/loopback in local development
      if (request != null) {
         String remoteAddr = request.getRemoteAddr();
         if ("127.0.0.1".equals(remoteAddr) || "0:0:0:0:0:0:0:1".equals(remoteAddr) || "localhost".equals(remoteAddr)) {
            return true;
         }
      }
      if (syncApiKey == null || syncApiKey.isBlank()) {
         log.info("SYNC_API_KEY is not configured on the server. Allowing sync request for unauthenticated environment.");
         return true;
      }
      if (headerKey == null || headerKey.isBlank()) {
         return false;
      }
      return java.security.MessageDigest.isEqual(
            syncApiKey.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            headerKey.getBytes(java.nio.charset.StandardCharsets.UTF_8)
      );
   }

   @RequestMapping(method = {RequestMethod.GET, RequestMethod.POST})
   @Operation(summary = "Manually trigger 2026 season data sync", description = "Fetches latest driver standings, constructor standings, and race results from external APIs.")
   public ResponseEntity<ApiResponse<String>> triggerSync(
         @RequestHeader(value = "X-Sync-Key", required = false) String apiKeyHeader,
         jakarta.servlet.http.HttpServletRequest request) {
      if (!isAuthorized(apiKeyHeader, request)) {
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
         log.error("Failed to sync data: {}", e.getMessage(), e);
         String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
         if (e.getCause() != null && e.getCause().getMessage() != null) {
            msg += " (Cause: " + e.getCause().getMessage() + ")";
         }
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
               .body(ApiResponse.error("Failed to sync data: " + msg));
      }
   }

   @RequestMapping(value = "/backfill/{season}", method = {RequestMethod.GET, RequestMethod.POST})
   @Operation(summary = "Backfill historical race/qualifying/sprint results for a past season")
   public ResponseEntity<ApiResponse<String>> triggerBackfill(
         @PathVariable Integer season,
         @RequestHeader(value = "X-Sync-Key", required = false) String apiKeyHeader,
         jakarta.servlet.http.HttpServletRequest request) {
      if (!isAuthorized(apiKeyHeader, request)) {
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
