package com.f1dashboard.dto;

import java.util.List;

public record ConstructorDetailDto(
      Long id,
      String name,
      String nationality,
      String logoUrl,
      String color,
      Double points,
      Integer wins,
      Integer championshipPosition,
      List<DriverDto> drivers) {
}