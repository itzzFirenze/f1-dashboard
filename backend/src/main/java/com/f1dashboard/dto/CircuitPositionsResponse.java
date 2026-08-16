package com.f1dashboard.dto;

import java.util.List;

/**
 * Response payload echoing the updated circuit position data.
 */
public record CircuitPositionsResponse(
      String circuitId,
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
