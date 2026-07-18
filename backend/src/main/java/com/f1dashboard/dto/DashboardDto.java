package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Aggregated dashboard data DTO.
 * Contains season overview, next race info, and championship leaders.
 */
public record DashboardDto(
    Integer currentSeason,
    Integer totalRaces,
    Integer racesCompleted,
    Integer racesRemaining,

    // Next race info
    Long nextRaceId,
    String nextRaceName,
    String nextRaceCountry,
    String nextRaceCircuit,
    LocalDate nextRaceDate,
    LocalTime nextRaceTime,

    // Next session info (e.g. FP1, Qualifying, Race)
    String nextSessionName,
    LocalDate nextSessionDate,
    LocalTime nextSessionTime,

    // Championship leaders
    DriverDto driverChampionshipLeader,
    ConstructorDto constructorChampionshipLeader,

    // Weather for next race
    WeatherDto nextRaceWeather
) {}
