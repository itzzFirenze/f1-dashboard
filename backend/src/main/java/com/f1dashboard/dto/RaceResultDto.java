package com.f1dashboard.dto;

public record RaceResultDto(
      Long id,
      Integer position,
      String driverCode,
      String driverFirstName,
      String driverLastName,
      String constructorName,
      String constructorColor,
      Double points,
      String status,
      Boolean fastestLap,
      Integer gridPosition,
      String q1,
      String q2,
      String q3,
      String lapTime,
      String gap,
      Integer lapsCompleted,
      Double durationSector1,
      Double durationSector2,
      Double durationSector3) {

   public RaceResultDto(
         Long id,
         Integer position,
         String driverCode,
         String driverFirstName,
         String driverLastName,
         String constructorName,
         String constructorColor,
         Double points,
         String status,
         Boolean fastestLap,
         Integer gridPosition,
         String q1,
         String q2,
         String q3) {
      this(id, position, driverCode, driverFirstName, driverLastName, constructorName,
            constructorColor, points, status, fastestLap, gridPosition, q1, q2, q3,
            null, null, null, null, null, null);
   }
}