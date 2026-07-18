package com.f1dashboard.dto;

/**
 * Driver summary DTO for standings tables.
 */
public record DriverDto(
    Long id,
    String code,
    String firstName,
    String lastName,
    Integer number,
    String nationality,
    String imageUrl,
    Double points,
    Integer wins,
    Integer podiums,
    Integer championshipPosition,
    String constructorName,
    String constructorColor
) {}
