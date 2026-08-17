package com.f1dashboard.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record RaceSessionDto(
      Long id,
      String sessionType,
      String sessionDisplayName,
      LocalDate sessionDate,
      LocalTime sessionTime,
      String status) {
}