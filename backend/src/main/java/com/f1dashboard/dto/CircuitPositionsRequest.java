package com.f1dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CircuitPositionsRequest(
      @NotBlank(message = "circuitId cannot be blank") String circuitId,

      List<Double> cornerPositions,

      Double sector1StartPercent,
      Double sector2StartPercent,
      Double sector3StartPercent,

      List<List<Double>> activeAeroRanges,

      Double overtakeDetectionPercent,
      Double overtakeActivationPercent,

      Double speedTrapPercent,

      Double pitLaneEntryPercent,
      Double pitLaneExitPercent,
      Double pitLaneSpeedLimitKmh) {
}