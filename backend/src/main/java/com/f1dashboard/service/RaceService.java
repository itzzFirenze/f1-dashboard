package com.f1dashboard.service;

import com.f1dashboard.dto.*;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.entity.RaceSession;
import com.f1dashboard.entity.WeatherData;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for race-related business logic.
 * Handles season calendar, race details, sessions, and results.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RaceService {

    private final RaceRepository raceRepository;
    private final RaceSessionRepository sessionRepository;
    private final RaceResultRepository resultRepository;
    private final WeatherDataRepository weatherRepository;

    /** Get all races for a season */
    public List<RaceDto> getRacesBySeason(Integer season) {
        return raceRepository.findBySeasonOrderByRoundAsc(season)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get races filtered by status */
    public List<RaceDto> getRacesByStatus(Integer season, RaceStatus status) {
        return raceRepository.findBySeasonAndStatusOrderByRoundAsc(season, status)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Search races by name or country */
    public List<RaceDto> searchRaces(Integer season, String query) {
        return raceRepository.searchRaces(season, query)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get detailed race info with sessions, results, and weather */
    public RaceDetailDto getRaceById(Long id) {
        Race race = raceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Race", "id", id));

        List<RaceSessionDto> sessions = sessionRepository
                .findByRaceIdOrderBySessionDateAscSessionTimeAsc(id)
                .stream()
                .map(this::toSessionDto)
                .toList();

        List<RaceResultDto> results = resultRepository
                .findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.RACE)
                .stream()
                .map(this::toResultDto)
                .toList();

        List<RaceResultDto> sprintResults = resultRepository
                .findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.SPRINT)
                .stream()
                .map(this::toResultDto)
                .toList();

        List<RaceResultDto> qualifyingResults = resultRepository
                .findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.QUALIFYING)
                .stream()
                .map(this::toResultDto)
                .toList();

        WeatherDto weather = weatherRepository.findByRaceId(id)
                .map(this::toWeatherDto)
                .orElse(null);

        return new RaceDetailDto(
            race.getId(), race.getSeason(), race.getRound(), race.getName(),
            toCircuitDto(race),
            race.getRaceDate(), race.getRaceTime(),
            race.getStatus().name(), race.getSprintWeekend(),
            sessions, results, sprintResults, qualifyingResults, weather
        );
    }

    /** Get the next upcoming race */
    public Race getNextRace() {
        return raceRepository.findNextUpcomingRace();
    }

    // ---- Mapping methods ----

    private RaceDto toDto(Race r) {
        return new RaceDto(
            r.getId(), r.getSeason(), r.getRound(), r.getName(),
            r.getCircuit().getName(),
            r.getCircuit().getCountry(),
            r.getCircuit().getLocation(),
            r.getRaceDate(), r.getRaceTime(),
            r.getStatus().name(), r.getSprintWeekend()
        );
    }

    private CircuitDto toCircuitDto(Race r) {
        var c = r.getCircuit();
        return new CircuitDto(
            c.getId(), c.getName(), c.getCountry(), c.getLocation(),
            c.getLengthKm(), c.getCorners(), c.getLapRecord(),
            c.getLapRecordHolder(), c.getImageUrl(),
            c.getLatitude(), c.getLongitude()
        );
    }

    private RaceSessionDto toSessionDto(RaceSession s) {
        return new RaceSessionDto(
            s.getId(), s.getSessionType().name(),
            s.getSessionType().getDisplayName(),
            s.getSessionDate(), s.getSessionTime(),
            s.getStatus().name()
        );
    }

    private RaceResultDto toResultDto(RaceResult r) {
        return new RaceResultDto(
            r.getId(), r.getPosition(),
            r.getDriver().getCode(),
            r.getDriver().getFirstName(),
            r.getDriver().getLastName(),
            r.getDriver().getConstructor() != null ? r.getDriver().getConstructor().getName() : null,
            r.getDriver().getConstructor() != null ? r.getDriver().getConstructor().getColor() : null,
            r.getPoints(), r.getStatus(), r.getFastestLap(), r.getGridPosition()
        );
    }

    private WeatherDto toWeatherDto(WeatherData w) {
        return new WeatherDto(
            w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
            w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated()
        );
    }
}
