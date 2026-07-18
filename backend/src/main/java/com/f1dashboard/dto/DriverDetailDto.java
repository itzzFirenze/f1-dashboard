package com.f1dashboard.dto;

import java.time.LocalDate;

/**
 * Detailed driver DTO for the driver profile page.
 */
public record DriverDetailDto(
    Long id,
    String code,
    String firstName,
    String lastName,
    Integer number,
    LocalDate dateOfBirth,
    String nationality,
    String imageUrl,
    Double points,
    Integer wins,
    Integer podiums,
    Integer championshipPosition,
    String constructorName,
    String constructorColor,
    Long constructorId
) {}
