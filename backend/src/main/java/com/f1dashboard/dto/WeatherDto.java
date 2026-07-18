package com.f1dashboard.dto;

import java.time.LocalDateTime;

/**
 * Weather data DTO.
 */
public record WeatherDto(
    Double temperature,
    Integer rainProbability,
    Double windSpeed,
    String condition,
    Integer humidity,
    LocalDateTime lastUpdated
) {}
