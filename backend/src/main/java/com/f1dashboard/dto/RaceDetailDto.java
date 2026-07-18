package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Detailed race DTO including sessions, results, circuit info, and weather.
 */
public record RaceDetailDto(
    Long id,
    Integer season,
    Integer round,
    String name,
    CircuitDto circuit,
    LocalDate raceDate,
    LocalTime raceTime,
    String status,
    Boolean sprintWeekend,
    List<RaceSessionDto> sessions,
    List<RaceResultDto> results,
    WeatherDto weather
) {}
