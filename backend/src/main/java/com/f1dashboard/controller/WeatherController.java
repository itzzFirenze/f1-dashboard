package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.WeatherDto;
import com.f1dashboard.service.WeatherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Tag(name = "Weather", description = "Race weather data")
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/race/{raceId}")
    @Operation(summary = "Get weather for a race weekend")
    public ResponseEntity<ApiResponse<WeatherDto>> getWeatherForRace(@PathVariable Long raceId) {
        WeatherDto weather = weatherService.getWeatherForRace(raceId);
        return ResponseEntity.ok(ApiResponse.success(weather));
    }
}
