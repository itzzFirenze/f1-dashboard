package com.f1dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * Request payload for updating all circuit position data in index.ts.
 * Null fields are skipped during update.
 */
public record CircuitPositionsRequest(
    @NotBlank(message = "circuitId cannot be blank")
    String circuitId,

    List<Double> cornerPositions,

    Double sector1StartPercent,
    Double sector2StartPercent,
    Double sector3StartPercent,

    List<List<Double>> activeAeroRanges,

    Double overtakeDetectionPercent,
    Double overtakeActivationPercent,

    Double speedTrapPercent
) {}
