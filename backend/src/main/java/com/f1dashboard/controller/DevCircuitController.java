package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.CircuitPositionsRequest;
import com.f1dashboard.dto.CircuitPositionsResponse;
import com.f1dashboard.service.DevCircuitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev/circuits")
@RequiredArgsConstructor
@Profile({ "dev", "default" })
@Tag(name = "Dev Circuits", description = "Development-only circuit editor utilities")
public class DevCircuitController {

   private final DevCircuitService devCircuitService;

   @PostMapping("/corner-positions")
   @Operation(summary = "Save circuit position data directly to index.ts source file")
   public ResponseEntity<ApiResponse<CircuitPositionsResponse>> updateCircuitPositions(
         @Valid @RequestBody CircuitPositionsRequest request) {
      devCircuitService.updateCircuitPositions(
            request.circuitId(),
            request.cornerPositions(),
            request.sector1StartPercent(),
            request.sector2StartPercent(),
            request.sector3StartPercent(),
            request.activeAeroRanges(),
            request.overtakeDetectionPercent(),
            request.overtakeActivationPercent(),
            request.speedTrapPercent(),
            request.pitLaneEntryPercent(),
            request.pitLaneExitPercent(),
            request.pitLaneSpeedLimitKmh());

      CircuitPositionsResponse response = new CircuitPositionsResponse(
            request.circuitId(),
            request.cornerPositions(),
            request.sector1StartPercent(),
            request.sector2StartPercent(),
            request.sector3StartPercent(),
            request.activeAeroRanges(),
            request.overtakeDetectionPercent(),
            request.overtakeActivationPercent(),
            request.speedTrapPercent(),
            request.pitLaneEntryPercent(),
            request.pitLaneExitPercent(),
            request.pitLaneSpeedLimitKmh());

      return ResponseEntity.ok(ApiResponse.success(
            response,
            "Updated " + request.circuitId() + " in index.ts"));
   }
}