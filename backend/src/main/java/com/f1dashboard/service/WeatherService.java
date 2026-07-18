package com.f1dashboard.service;

import com.f1dashboard.dto.WeatherDto;
import com.f1dashboard.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Weather data service.
 * Retrieves cached weather data for race weekends.
 * Architecture is ready for integration with real weather APIs.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class WeatherService {

    private final WeatherDataRepository weatherRepository;

    /** Get weather for a specific race from cache */
    public WeatherDto getWeatherForRace(Long raceId) {
        return weatherRepository.findByRaceId(raceId)
                .map(w -> new WeatherDto(
                    w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
                    w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated()
                ))
                .orElse(null);
    }
}
