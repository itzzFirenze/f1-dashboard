package com.f1dashboard.service;

import com.f1dashboard.dto.*;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.entity.RaceSession;
import com.f1dashboard.entity.WeatherData;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for race-related business logic.
 * Handles season calendar, race details, sessions, and results.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RaceService {

   private final RaceRepository raceRepository;
   private final RaceSessionRepository sessionRepository;
   private final RaceResultRepository resultRepository;
   private final WeatherDataRepository weatherRepository;
   private final DriverRepository driverRepository;
   private final RestTemplate restTemplate;
   private final ObjectMapper objectMapper;

   @Value("${app.api.openf1-base-url:https://api.openf1.org/v1}")
   private String openf1BaseUrl;

   /** Get all races for a season */
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'season:' + #season")
   public List<RaceDto> getRacesBySeason(Integer season) {
      return raceRepository.findBySeasonOrderByRoundAsc(season)
            .stream()
            .map(this::toDto)
            .toList();
   }

   /** Get races filtered by status */
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'status:' + #season + ':' + #status")
   public List<RaceDto> getRacesByStatus(Integer season, RaceStatus status) {
      return raceRepository.findBySeasonAndStatusOrderByRoundAsc(season, status)
            .stream()
            .map(this::toDto)
            .toList();
   }

   /** Search races by name or country */
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'search:' + #season + ':' + #query")
   public List<RaceDto> searchRaces(Integer season, String query) {
      return raceRepository.searchRaces(season, query)
            .stream()
            .map(this::toDto)
            .toList();
   }

   /** Get detailed race info with sessions, results, and weather */
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'detail:' + #id")
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

      List<RaceResultDto> sprintQualifyingResults = resultRepository
            .findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.SPRINT_QUALIFYING)
            .stream()
            .map(this::toResultDto)
            .toList();

      List<RaceResultDto> fp1Results = filterValidPractice(
            resultRepository.findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.FP1)
      );

      List<RaceResultDto> fp2Results = filterValidPractice(
            resultRepository.findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.FP2)
      );

      List<RaceResultDto> fp3Results = filterValidPractice(
            resultRepository.findByRaceIdAndSessionTypeOrderByPositionAsc(id, com.f1dashboard.enums.SessionType.FP3)
      );

      WeatherDto weather = weatherRepository.findByRaceId(id)
            .map(this::toWeatherDto)
            .orElse(null);

      return new RaceDetailDto(
            race.getId(), race.getSeason(), race.getRound(), race.getName(),
            toCircuitDto(race),
            race.getRaceDate(), race.getRaceTime(),
            race.getStatus().name(), race.getSprintWeekend(),
            sessions, results, sprintResults, qualifyingResults, sprintQualifyingResults,
            fp1Results, fp2Results, fp3Results, weather);
   }

   private List<RaceResultDto> filterValidPractice(List<RaceResult> list) {
      if (list == null || list.isEmpty()) return List.of();
      boolean anyValid = list.stream().anyMatch(r -> r.getQ1Time() != null || (r.getStatus() != null && !"NO TIME".equalsIgnoreCase(r.getStatus())));
      if (!anyValid) return List.of();
      return list.stream().map(this::toResultDto).toList();
   }

   /** Get practice classification (FP1, FP2, FP3) */
   @Transactional
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'practice:' + #raceId + ':' + #sessionType")
   public List<RaceResultDto> getPracticeResults(Long raceId, com.f1dashboard.enums.SessionType sessionType) {
      List<RaceResultDto> existing = resultRepository
            .findByRaceIdAndSessionTypeOrderByPositionAsc(raceId, sessionType)
            .stream()
            .map(this::toResultDto)
            .toList();

      boolean hasValidExisting = existing.stream().anyMatch(dto -> dto.q1() != null && !"NO TIME".equalsIgnoreCase(dto.status()));
      if (hasValidExisting) {
         return existing;
      } else if (!existing.isEmpty()) {
         try {
            resultRepository.deleteAll(
               resultRepository.findByRaceIdAndSessionTypeOrderByPositionAsc(raceId, sessionType)
            );
         } catch (Exception ex) {
            log.warn("Could not purge invalid practice records: {}", ex.getMessage());
         }
      }

      List<RaceResultDto> fetched = fetchOpenF1PracticeResults(raceId, sessionType);
      if (!fetched.isEmpty()) {
         try {
            Race race = raceRepository.findById(raceId).orElse(null);
            if (race != null) {
               for (RaceResultDto dto : fetched) {
                  Driver driver = driverRepository.findByCode(dto.driverCode()).orElse(null);
                  if (driver != null) {
                     RaceResult rr = RaceResult.builder()
                           .race(race)
                           .sessionType(sessionType)
                           .position(dto.position())
                           .driver(driver)
                           .constructor(driver.getConstructor())
                           .points(0.0)
                           .status(dto.status())
                           .fastestLap(dto.fastestLap())
                           .gridPosition(0)
                           .q1Time(dto.q1())
                           .q2Time(dto.q2())
                           .q3Time(dto.q3())
                           .build();
                     resultRepository.save(rr);
                  }
               }
            }
         } catch (Exception ex) {
            log.warn("Could not persist practice results to database: {}", ex.getMessage());
         }
      }
      return fetched;
   }

   private List<RaceResultDto> fetchOpenF1PracticeResults(Long raceId, com.f1dashboard.enums.SessionType sessionType) {
      try {
         Race race = raceRepository.findById(raceId).orElse(null);
         if (race == null || race.getCircuit() == null) return List.of();

         String sessionName = switch (sessionType) {
            case FP1 -> "Practice 1";
            case FP2 -> "Practice 2";
            case FP3 -> "Practice 3";
            default -> null;
         };
         if (sessionName == null) return List.of();

         String sessionsUrl = UriComponentsBuilder.fromUriString(openf1BaseUrl + "/sessions")
               .queryParam("year", race.getSeason())
               .queryParam("session_name", sessionName)
               .build().toUriString();

         String sessionsJson = restTemplate.getForObject(sessionsUrl, String.class);
         if (sessionsJson == null) return List.of();

         JsonNode sessionsNode = objectMapper.readTree(sessionsJson);
         if (!sessionsNode.isArray() || sessionsNode.isEmpty()) return List.of();

         String raceLoc = race.getCircuit().getLocation() != null ? race.getCircuit().getLocation().toLowerCase() : "";
         String raceCountry = race.getCircuit().getCountry() != null ? race.getCircuit().getCountry().toLowerCase() : "";
         LocalDate raceDate = race.getRaceDate();

         JsonNode matchedSession = null;
         for (JsonNode sn : sessionsNode) {
            String sLoc = sn.path("location").asText("").toLowerCase();
            String sCountry = sn.path("country_name").asText("").toLowerCase();
            String sCircuit = sn.path("circuit_short_name").asText("").toLowerCase();
            String dateStartStr = sn.path("date_start").asText("");

            boolean locMatch = !raceLoc.isEmpty() && (sLoc.contains(raceLoc) || raceLoc.contains(sLoc));
            boolean countryMatch = !raceCountry.isEmpty() && (sCountry.contains(raceCountry) || raceCountry.contains(sCountry));
            boolean circuitMatch = !raceLoc.isEmpty() && sCircuit.contains(raceLoc);

            boolean dateMatch = false;
            if (raceDate != null && !dateStartStr.isEmpty()) {
               try {
                  LocalDate sessionDate = LocalDate.parse(dateStartStr.substring(0, 10));
                  dateMatch = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(raceDate, sessionDate)) <= 4;
               } catch (Exception ignored) {}
            }

            if ((locMatch || countryMatch || circuitMatch) && (dateMatch || raceDate == null)) {
               matchedSession = sn;
               break;
            }
         }

         if (matchedSession == null) return List.of();
         int sessionKey = matchedSession.path("session_key").asInt();
         if (sessionKey == 0) return List.of();

         // Fetch drivers
         String driversUrl = openf1BaseUrl + "/drivers?session_key=" + sessionKey;
         String driversJson = restTemplate.getForObject(driversUrl, String.class);
         JsonNode driversNode = driversJson != null ? objectMapper.readTree(driversJson) : null;
         if (driversNode == null || !driversNode.isArray()) return List.of();

         // Fetch laps
         String lapsUrl = openf1BaseUrl + "/laps?session_key=" + sessionKey;
         String lapsJson = restTemplate.getForObject(lapsUrl, String.class);
         JsonNode lapsNode = lapsJson != null ? objectMapper.readTree(lapsJson) : null;

         record DriverLapStats(Double bestLap, Double s1, Double s2, Double s3, int totalLaps) {}
         java.util.Map<Integer, DriverLapStats> statsMap = new java.util.HashMap<>();

         if (lapsNode != null && lapsNode.isArray()) {
            for (JsonNode lap : lapsNode) {
               int driverNum = lap.path("driver_number").asInt();
               double duration = lap.path("lap_duration").asDouble(0);
               DriverLapStats curr = statsMap.get(driverNum);
               int newCount = (curr != null ? curr.totalLaps : 0) + 1;

               if (duration > 0) {
                  if (curr == null || curr.bestLap == null || duration < curr.bestLap) {
                     Double s1 = lap.hasNonNull("duration_sector_1") ? lap.path("duration_sector_1").asDouble() : null;
                     Double s2 = lap.hasNonNull("duration_sector_2") ? lap.path("duration_sector_2").asDouble() : null;
                     Double s3 = lap.hasNonNull("duration_sector_3") ? lap.path("duration_sector_3").asDouble() : null;
                     statsMap.put(driverNum, new DriverLapStats(duration, s1, s2, s3, newCount));
                     continue;
                  }
               }
               if (curr != null) {
                  statsMap.put(driverNum, new DriverLapStats(curr.bestLap, curr.s1, curr.s2, curr.s3, newCount));
               } else {
                  statsMap.put(driverNum, new DriverLapStats(null, null, null, null, newCount));
               }
            }
         }

         record DriverData(int num, String code, String firstName, String lastName, String teamName, String color, DriverLapStats stats) {}
         List<DriverData> driverList = new java.util.ArrayList<>();

         for (JsonNode dn : driversNode) {
            int dNum = dn.path("driver_number").asInt();
            String code = dn.path("name_acronym").asText("");
            String fName = dn.path("first_name").asText("");
            String lName = dn.path("last_name").asText(dn.path("broadcast_name").asText(""));
            String team = dn.path("team_name").asText("");
            String color = dn.path("team_colour").asText("");
            if (!color.isEmpty() && !color.startsWith("#")) {
               color = "#" + color;
            }
            driverList.add(new DriverData(dNum, code, fName, lName, team, color, statsMap.getOrDefault(dNum, new DriverLapStats(null, null, null, null, 0))));
         }

         driverList.sort((a, b) -> {
            Double aLap = a.stats.bestLap;
            Double bLap = b.stats.bestLap;
            if (aLap != null && bLap != null) return Double.compare(aLap, bLap);
            if (aLap != null) return -1;
            if (bLap != null) return 1;
            return a.lastName.compareToIgnoreCase(b.lastName);
         });

         Double p1Best = !driverList.isEmpty() && driverList.get(0).stats.bestLap != null ? driverList.get(0).stats.bestLap : null;
         if (p1Best == null) {
            return List.of();
         }

         List<RaceResultDto> results = new java.util.ArrayList<>();
         for (int i = 0; i < driverList.size(); i++) {
            DriverData d = driverList.get(i);
            int pos = i + 1;
            Double lapSec = d.stats.bestLap;
            String lapTimeStr = lapSec != null ? formatLapDuration(lapSec) : null;
            String gapStr;
            if (pos == 1 && lapSec != null) {
               gapStr = "LEADER";
            } else if (lapSec != null && p1Best != null) {
               gapStr = String.format("+%.3f", (lapSec - p1Best));
            } else {
               gapStr = "-";
            }
            String status = lapTimeStr != null ? lapTimeStr : "NO TIME";
            boolean fastestLap = (pos == 1 && lapSec != null);

            results.add(new RaceResultDto(
                  (long) d.num,
                  pos,
                  d.code,
                  d.firstName,
                  d.lastName,
                  d.teamName,
                  d.color,
                  0.0,
                  status,
                  fastestLap,
                  0,
                  lapTimeStr,
                  gapStr,
                  null,
                  lapTimeStr,
                  gapStr,
                  d.stats.totalLaps,
                  d.stats.s1,
                  d.stats.s2,
                  d.stats.s3
            ));
         }

         return results;
      } catch (Exception e) {
         log.error("Failed to fetch OpenF1 practice results for race {}: {}", raceId, e.getMessage());
         return List.of();
      }
   }

   private String formatLapDuration(double seconds) {
      int minutes = (int) (seconds / 60);
      double rem = seconds % 60;
      return String.format("%d:%06.3f", minutes, rem);
   }

   /** Get the next upcoming race */
   @Cacheable(cacheNames = CacheConfig.RACES, key = "'next'")
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
            r.getStatus().name(), r.getSprintWeekend());
   }

   private CircuitDto toCircuitDto(Race r) {
      var c = r.getCircuit();
      return new CircuitDto(
            c.getId(), c.getName(), c.getCountry(), c.getLocation(),
            c.getLengthKm(), c.getCorners(), c.getLapRecord(),
            c.getLapRecordHolder(), c.getImageUrl(),
            c.getLatitude(), c.getLongitude());
   }

   private RaceSessionDto toSessionDto(RaceSession s) {
      return new RaceSessionDto(
            s.getId(), s.getSessionType().name(),
            s.getSessionType().getDisplayName(),
            s.getSessionDate(), s.getSessionTime(),
            s.getStatus().name());
   }

   private RaceResultDto toResultDto(RaceResult r) {
      return new RaceResultDto(
            r.getId(), r.getPosition(),
            r.getDriver().getCode(),
            r.getDriver().getFirstName(),
            r.getDriver().getLastName(),
            r.getDriver().getConstructor() != null ? r.getDriver().getConstructor().getName() : null,
            r.getDriver().getConstructor() != null ? r.getDriver().getConstructor().getColor() : null,
            r.getPoints(), r.getStatus(), r.getFastestLap(), r.getGridPosition(),
            r.getQ1Time(), r.getQ2Time(), r.getQ3Time());
   }

   private WeatherDto toWeatherDto(WeatherData w) {
      return new WeatherDto(
            w.getTemperature(), w.getRainProbability(), w.getWindSpeed(),
            w.getWeatherCondition(), w.getHumidity(), w.getLastUpdated());
   }
}
