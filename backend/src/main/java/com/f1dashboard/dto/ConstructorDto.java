package com.f1dashboard.dto;

import java.util.List;

/**
 * Constructor summary DTO for standings tables.
 */
public record ConstructorDto(
    Long id,
    String name,
    String nationality,
    String logoUrl,
    String color,
    Double points,
    Integer wins,
    Integer championshipPosition
) {}
