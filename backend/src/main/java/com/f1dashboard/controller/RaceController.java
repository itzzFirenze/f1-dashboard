package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.RaceDetailDto;
import com.f1dashboard.dto.RaceDto;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.service.RaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
@Tag(name = "Races", description = "Race schedule and results")
public class RaceController {

    private final RaceService raceService;

    @GetMapping
    @Operation(summary = "Get season race calendar", description = "Supports filtering by status and search")
    public ResponseEntity<ApiResponse<List<RaceDto>>> getRaces(
            @RequestParam(defaultValue = "2026") Integer season,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<RaceDto> races;
        if (search != null && !search.isBlank()) {
            races = raceService.searchRaces(season, search);
        } else if (status != null && !status.isBlank()) {
            races = raceService.getRacesByStatus(season, RaceStatus.valueOf(status.toUpperCase()));
        } else {
            races = raceService.getRacesBySeason(season);
        }
        return ResponseEntity.ok(ApiResponse.success(races));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get race details", description = "Returns race detail with sessions, results, and weather")
    public ResponseEntity<ApiResponse<RaceDetailDto>> getRaceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(raceService.getRaceById(id)));
    }
}
