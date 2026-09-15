package com.f1dashboard.service;

import com.f1dashboard.dto.*;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Race;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.RaceResultRepository;
import com.f1dashboard.repository.RaceSessionRepository;
import com.f1dashboard.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
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
   private final RaceSessionRepository raceSessionRepository;
   private final RaceResultRepository raceResultRepository;

   /** Build the complete dashboard payload */
   @Cacheable(cacheNames = CacheConfig.DASHBOARD, key = "'home'")
   public DashboardDto getDashboardData() {
      long totalRaces = raceRepository.findBySeasonOrderByRoundAsc(CURRENT_SEASON).size();
      long completed = raceRepository.countBySeasonAndStatus(CURRENT_SEASON, RaceStatus.COMPLETED);
      long remaining = totalRaces - completed;

      Race nextRace = raceService.getNextRace();

      WeatherDto nextRaceWeather = null;
      String nextSessionName = null;
      java.time.LocalDate nextSessionDate = null;
      java.time.LocalTime nextSessionTime = null;
      Boolean sessionLive = false;

      if (nextRace != null) {
         nextRaceWeather = weatherRepository.findByRaceId(nextRace.getId())
               .map(w -> new WeatherDto(
                     w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
                     w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated()))
               .orElse(null);

         // Find next immediate session or currently active session awaiting results
         // Session times are stored as UTC, so compare against UTC now.
         java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
         java.util.List<com.f1dashboard.entity.RaceSession> sessions = raceSessionRepository
               .findByRaceIdOrderBySessionDateAscSessionTimeAsc(nextRace.getId());

         for (com.f1dashboard.entity.RaceSession s : sessions) {
            if (s.getSessionDate() == null || s.getSessionTime() == null) continue;

            java.time.LocalDateTime sessionStart = java.time.LocalDateTime.of(s.getSessionDate(), s.getSessionTime());
            com.f1dashboard.enums.SessionType type = s.getSessionType();

            boolean isCompleted;
            if (type == com.f1dashboard.enums.SessionType.RACE
                  || type == com.f1dashboard.enums.SessionType.QUALIFYING
                  || type == com.f1dashboard.enums.SessionType.SPRINT
                  || type == com.f1dashboard.enums.SessionType.SPRINT_QUALIFYING) {
               // Session is completed if and only if results have been synced into the database
               isCompleted = raceResultRepository.existsByRaceIdAndSessionType(nextRace.getId(), type);
            } else {
               // Practice sessions (FP1, FP2, FP3) do not produce result records.
               // Consider completed 90 minutes after session start.
               isCompleted = sessionStart.plusMinutes(90).isBefore(now);
            }

            if (isCompleted) {
               continue;
            }

            // Session has not completed yet:
            // either it is in the future (sessionStart > now), or currently live awaiting results (sessionStart <= now)
            nextSessionName = type.getDisplayName();
            nextSessionDate = s.getSessionDate();
            nextSessionTime = s.getSessionTime();
            sessionLive = !sessionStart.isAfter(now);
            break;
         }

         // Fallback to Race only if race results have not been recorded yet
         if (nextSessionName == null) {
            boolean raceHasResults = raceResultRepository.existsByRaceIdAndSessionType(
                  nextRace.getId(), com.f1dashboard.enums.SessionType.RACE);
            if (!raceHasResults && nextRace.getRaceDate() != null) {
               nextSessionName = "Race";
               nextSessionDate = nextRace.getRaceDate();
               nextSessionTime = nextRace.getRaceTime();
               if (nextRace.getRaceTime() != null) {
                  java.time.LocalDateTime raceStart = java.time.LocalDateTime.of(
                        nextRace.getRaceDate(), nextRace.getRaceTime());
                  sessionLive = !raceStart.isAfter(now);
               }
            }
         }
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
            nextSessionName,
            nextSessionDate,
            nextSessionTime,
            sessionLive,
            driverService.getChampionshipLeader(),
            constructorService.getChampionshipLeader(),
            nextRaceWeather);
   }
}
