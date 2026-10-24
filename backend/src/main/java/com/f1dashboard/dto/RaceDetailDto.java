package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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
      List<RaceResultDto> sprintResults,
      List<RaceResultDto> qualifyingResults,
      List<RaceResultDto> sprintQualifyingResults,
      List<RaceResultDto> fp1Results,
      List<RaceResultDto> fp2Results,
      List<RaceResultDto> fp3Results,
      WeatherDto weather) {

   public RaceDetailDto(
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
         List<RaceResultDto> sprintResults,
         List<RaceResultDto> qualifyingResults,
         List<RaceResultDto> sprintQualifyingResults,
         WeatherDto weather) {
      this(id, season, round, name, circuit, raceDate, raceTime, status, sprintWeekend,
            sessions, results, sprintResults, qualifyingResults, sprintQualifyingResults,
            List.of(), List.of(), List.of(), weather);
   }
}