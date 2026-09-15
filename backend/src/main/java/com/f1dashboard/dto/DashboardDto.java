package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DashboardDto(
      Integer currentSeason,
      Integer totalRaces,
      Integer racesCompleted,
      Integer racesRemaining,

      Long nextRaceId,
      String nextRaceName,
      String nextRaceCountry,
      String nextRaceCircuit,
      LocalDate nextRaceDate,
      LocalTime nextRaceTime,

      String nextSessionName,
      LocalDate nextSessionDate,
      LocalTime nextSessionTime,
      Boolean sessionLive,

      DriverDto driverChampionshipLeader,
      ConstructorDto constructorChampionshipLeader,

      WeatherDto nextRaceWeather) {
}