package com.f1dashboard.service;

import com.f1dashboard.dto.WeatherDto;
import com.f1dashboard.dto.WeekendWeatherDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.WeatherData;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

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
    private final RaceRepository raceRepository;

    /** Get weather for a specific race from cache */
    @Cacheable(cacheNames = CacheConfig.WEATHER, key = "'race:' + #raceId")
    public WeatherDto getWeatherForRace(Long raceId) {
        return weatherRepository.findByRaceId(raceId)
                .map(w -> new WeatherDto(
                    w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
                    w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated()
                ))
                .orElse(null);
    }

    /** Get weekend forecast for all upcoming races */
    @Cacheable(cacheNames = CacheConfig.WEATHER, key = "'upcoming:' + #season")
    public List<WeekendWeatherDto> getUpcomingWeekendForecasts(Integer season) {
        List<Race> upcomingRaces = raceRepository.findBySeasonOrderByRoundAsc(season).stream()
                .filter(r -> r.getStatus() == RaceStatus.UPCOMING || r.getStatus() == RaceStatus.IN_PROGRESS)
                .toList();

        List<WeekendWeatherDto> forecasts = new ArrayList<>();

        for (Race race : upcomingRaces) {
            WeekendWeatherDto dto = new WeekendWeatherDto();
            dto.setRaceId(race.getId());
            dto.setRaceName(race.getName());
            dto.setCountry(race.getCircuit().getCountry());
            dto.setRaceDate(race.getRaceDate());

            // Check if we have real weather data
            WeatherData existing = weatherRepository.findByRaceId(race.getId()).orElse(null);

            List<WeekendWeatherDto.SessionWeather> sessions = new ArrayList<>();
            String[] sessionNames = race.getSprintWeekend()
                    ? new String[]{"FP1", "Sprint Quali", "Sprint", "Qualifying", "Race"}
                    : new String[]{"FP1", "FP2", "FP3", "Qualifying", "Race"};

            if (existing != null) {
                // Use existing weather as base and create slight per-session variations
                for (String sessionName : sessionNames) {
                    sessions.add(createSessionWeather(sessionName,
                            existing.getTemperature(), existing.getRainProbability(),
                            existing.getWindSpeed(), existing.getHumidity(),
                            existing.getWeatherCondition()));
                }
            } else {
                // Generate simulated weather based on circuit location (deterministic seed from race id)
                Random rng = new Random(race.getId() * 31 + race.getRound());
                double baseTemp = getBaseTemperature(race.getCircuit().getCountry());
                int baseRain = rng.nextInt(50);
                double baseWind = 5 + rng.nextDouble() * 20;
                int baseHumidity = 30 + rng.nextInt(50);

                for (String sessionName : sessionNames) {
                    double tempVariation = (rng.nextDouble() - 0.5) * 6;
                    int rainVariation = (int) ((rng.nextDouble() - 0.3) * 20);
                    double windVariation = (rng.nextDouble() - 0.5) * 8;
                    int humidityVariation = (int) ((rng.nextDouble() - 0.5) * 15);

                    double temp = baseTemp + tempVariation;
                    int rain = Math.max(0, Math.min(100, baseRain + rainVariation));
                    double wind = Math.max(0, baseWind + windVariation);
                    int humidity = Math.max(10, Math.min(95, baseHumidity + humidityVariation));
                    String condition = getCondition(rain);

                    sessions.add(createSessionWeather(sessionName, temp, rain, wind, humidity, condition));
                }
            }

            dto.setSessions(sessions);
            forecasts.add(dto);
        }

        return forecasts;
    }

    private WeekendWeatherDto.SessionWeather createSessionWeather(String name, Double temp, Integer rain, Double wind, Integer humidity, String condition) {
        WeekendWeatherDto.SessionWeather sw = new WeekendWeatherDto.SessionWeather();
        sw.setSessionName(name);
        sw.setTemperature(Math.round(temp * 10.0) / 10.0);
        sw.setRainProbability(rain);
        sw.setWindSpeed(Math.round(wind * 10.0) / 10.0);
        sw.setHumidity(humidity);
        sw.setCondition(condition);
        sw.setTrackTemperature(Math.round((temp + 15 + new Random().nextDouble() * 10) * 10.0) / 10.0);
        return sw;
    }

    private double getBaseTemperature(String country) {
        return switch (country.toLowerCase()) {
            case "bahrain", "saudi arabia", "qatar", "united arab emirates" -> 32 + Math.random() * 6;
            case "singapore" -> 30 + Math.random() * 3;
            case "australia", "brazil", "mexico" -> 24 + Math.random() * 6;
            case "united states" -> 22 + Math.random() * 10;
            case "japan", "china" -> 18 + Math.random() * 8;
            case "canada" -> 20 + Math.random() * 8;
            case "italy", "spain", "monaco", "azerbaijan" -> 22 + Math.random() * 8;
            case "united kingdom" -> 15 + Math.random() * 8;
            case "netherlands" -> 16 + Math.random() * 6;
            case "belgium" -> 14 + Math.random() * 8;
            case "hungary", "austria" -> 20 + Math.random() * 8;
            default -> 22 + Math.random() * 6;
        };
    }

    private String getCondition(int rainProbability) {
        if (rainProbability >= 70) return "Rain";
        if (rainProbability >= 50) return "Overcast";
        if (rainProbability >= 30) return "Partly Cloudy";
        if (rainProbability >= 15) return "Cloudy";
        return "Sunny";
    }
}
