package com.f1dashboard.dto;

/**
 * Race result DTO for a single driver's finish.
 */
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
    Integer gridPosition
) {}
