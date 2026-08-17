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
      String q3) {
}