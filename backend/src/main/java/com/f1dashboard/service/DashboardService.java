package com.f1dashboard.service;

import com.f1dashboard.dto.*;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.WeatherData;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregation service for the dashboard page.
 * Combines data from multiple sources into a single response.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final int CURRENT_SEASON = 2026;

    private final RaceRepository raceRepository;
    private final WeatherDataRepository weatherRepository;
    private final DriverService driverService;
    private final ConstructorService constructorService;
    private final RaceService raceService;

    /** Build the complete dashboard payload */
    public DashboardDto getDashboardData() {
        long totalRaces = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON).size();
        long completed = raceRepository.countBySeasonAndStatus(CURRENT_SEASON, RaceStatus.COMPLETED);
        long remaining = totalRaces - completed;

        Race nextRace = raceService.getNextRace();

        WeatherDto nextRaceWeather = null;
        if (nextRace != null) {
            nextRaceWeather = weatherRepository.findByRaceId(nextRace.getId())
                    .map(w -> new WeatherDto(
                        w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
                        w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated()
                    ))
                    .orElse(null);
        }

        return new DashboardDto(
            CURRENT_SEASON,
            (int) totalRaces,
            (int) completed,
            (int) remaining,
            nextRace != null ? nextRace.getId() : null,
            nextRace != null ? nextRace.getName() : null,
            nextRace != null ? nextRace.getCircuit().getCountry() : null,
            nextRace != null ? nextRace.getCircuit().getName() : null,
            nextRace != null ? nextRace.getRaceDate() : null,
            nextRace != null ? nextRace.getRaceTime() : null,
            driverService.getChampionshipLeader(),
            constructorService.getChampionshipLeader(),
            nextRaceWeather
        );
    }
}
