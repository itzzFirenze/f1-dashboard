package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Race summary DTO for the season calendar.
 */
public record RaceDto(
    Long id,
    Integer season,
    Integer round,
    String name,
    String circuitName,
    String country,
    String location,
    LocalDate raceDate,
    LocalTime raceTime,
    String status,
    Boolean sprintWeekend
) {}
