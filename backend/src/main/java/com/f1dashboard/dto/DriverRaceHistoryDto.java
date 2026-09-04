package com.f1dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public class DriverRaceHistoryDto {

   public record RaceEntry(
         Long raceId,
         Integer round,
         String raceName,
         String circuitName,
         String country,
         LocalDate raceDate,
         Integer gridPosition,
         Integer finishPosition,
         Double points,
         String status,
         Boolean fastestLap,
         Integer positionsGained,
         String sessionType
   ) {}

   /**
    * Represents a meaningful FIA penalty (grid drop, time penalty, pit lane start, drive through).
    * severity is always "PENALTY".
    */
   public record PenaltyEvent(
         String raceName,
         String sessionName,      // "Grand Prix", "Qualifying", "Sprint race", etc.
         Integer round,
         Integer lapNumber,
         String category,
         String penaltyType,      // "GRID_PENALTY" | "TIME_PENALTY" | "PITLANE_START" | "DRIVE_THROUGH"
         String penaltyDetail,    // Human-readable: "5 second time penalty", "Grid drop", etc.
         String message,          // Original steward message
         String severity,         // Always "PENALTY"
         String timestamp
   ) {}

   public record PerformanceStats(
         Double avgGrid,
         Double avgFinish,
         Integer totalPositionsGained,
         Integer totalRaces,
         Integer pointsScoringRaces,
         Double pointsFinishRate,
         Integer dnfCount,
         Integer fastestLapsCount,
         Integer bestFinish,
         Integer bestGrid
   ) {}

   public record HistoryResponse(
         Long driverId,
         String driverCode,
         String driverName,
         Integer season,
         PerformanceStats stats,
         List<RaceEntry> races,
         List<PenaltyEvent> penalties
   ) {}
}
