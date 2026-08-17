package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.ConsistencyDto;
import com.f1dashboard.dto.DriverComparisonDto;
import com.f1dashboard.dto.ConstructorComparisonDto;
import com.f1dashboard.dto.MomentumDto;
import com.f1dashboard.dto.TimelineDto;
import com.f1dashboard.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

   private final AnalyticsService analyticsService;

   @GetMapping("/compare/drivers")
   public ResponseEntity<ApiResponse<DriverComparisonDto>> compareDrivers(
         @RequestParam Long driverA,
         @RequestParam Long driverB,
         @RequestParam(defaultValue = "2026") Integer season) {
      return ResponseEntity.ok(ApiResponse.success(analyticsService.compareDrivers(driverA, driverB, season)));
   }

   @GetMapping("/momentum")
   public ResponseEntity<ApiResponse<MomentumDto>> getMomentum(
         @RequestParam Long driverId,
         @RequestParam(defaultValue = "5") Integer window,
         @RequestParam(defaultValue = "2026") Integer season) {
      return ResponseEntity.ok(ApiResponse.success(analyticsService.getDriverMomentum(driverId, window, season)));
   }

   @GetMapping("/consistency")
   public ResponseEntity<ApiResponse<ConsistencyDto>> getConsistency(
         @RequestParam(defaultValue = "2026") Integer season) {
      return ResponseEntity.ok(ApiResponse.success(analyticsService.getConsistencyAnalytics(season)));
   }

   @GetMapping("/compare/constructors")
   public ResponseEntity<ApiResponse<ConstructorComparisonDto>> compareConstructors(
         @RequestParam Long teamA,
         @RequestParam Long teamB,
         @RequestParam(defaultValue = "2026") Integer season) {
      return ResponseEntity.ok(ApiResponse.success(analyticsService.getConstructorComparison(teamA, teamB, season)));
   }

   @GetMapping("/timeline")
   public ResponseEntity<ApiResponse<TimelineDto>> getTimeline(
         @RequestParam(defaultValue = "2026") Integer season) {
      return ResponseEntity.ok(ApiResponse.success(analyticsService.getSeasonTimeline(season)));
   }
}