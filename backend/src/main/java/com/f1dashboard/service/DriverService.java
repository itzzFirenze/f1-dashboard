package com.f1dashboard.service;

import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.dto.DriverDetailDto;
import com.f1dashboard.dto.DriverRaceHistoryDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceResultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for driver-related business logic.
 * Maps entities to DTOs and handles search/pagination.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DriverService {

   private final DriverRepository driverRepository;
   private final RaceResultRepository raceResultRepository;
   private final RestTemplate restTemplate;

   private static final String OPENF1_BASE_URL = "https://api.openf1.org/v1";

   private static final Pattern TIME_PENALTY_PATTERN = Pattern.compile(
         "(?:(\\d+)\\s*(?:SECOND|SEC|S)?\\s+)?TIME\\s+PENALTY|(\\d+)\\s*(?:SECOND|SEC|S)\\s+PENALTY", Pattern.CASE_INSENSITIVE
   );
   private static final Pattern GRID_PENALTY_PATTERN = Pattern.compile(
         "(?:(\\d+)\\s*(?:PLACE|POSITION)?\\s+)?GRID\\s+(?:DROP|PENALTY)|GRID\\s+DROP", Pattern.CASE_INSENSITIVE
   );
   private static final Pattern PITLANE_START_PATTERN = Pattern.compile(
         "START\\s+(?:FROM|IN)\\s+(?:THE\\s+)?PIT\\s*LANE|PIT\\s*LANE\\s+START", Pattern.CASE_INSENSITIVE
   );
   private static final Pattern DRIVE_THROUGH_PATTERN = Pattern.compile(
         "DRIVE[\\s\\-]THROUGH(?:\\s+PENALTY)?", Pattern.CASE_INSENSITIVE
   );
   private static final Pattern EXCLUSION_PATTERN = Pattern.compile(
         "PENALTY\\s+(?:NOT\\s+)?SERVED|UNDER\\s+INVESTIGATION|WILL\\s+BE\\s+INVESTIGATED|\\bNOTED\\b|\\bREVIEWED\\b|NO\\s+FURTHER\\s+(?:ACTION|INVESTIGATION)|NO\\s+ACTION|WARNING|REPRIMAND|LAP\\s+DELETED|TIME\\s+.*\\s+DELETED|CHEQUERED\\s+FLAG|BLACK\\s+AND\\s+WHITE\\s+FLAG|BLUE\\s+FLAG",
         Pattern.CASE_INSENSITIVE
   );

   private record OpenF1Session(
         long sessionKey,
         long meetingKey,
         String sessionName,
         String circuitShortName,
         String countryName,
         String location
   ) {}

   // In-memory caches to prevent rate-limiting OpenF1
   private final Map<Integer, Map<Long, OpenF1Session>> seasonSessionsCache = new ConcurrentHashMap<>();
   private final Map<Integer, Long> sessionsCacheExpiry = new ConcurrentHashMap<>();

   private final Map<Integer, List<JsonNode>> seasonRaceControlCache = new ConcurrentHashMap<>();
   private final Map<Integer, Long> raceControlCacheExpiry = new ConcurrentHashMap<>();

   /** Get all drivers ordered by championship position */
   public List<DriverDto> getAllDrivers() {
      return getAllDrivers(null);
   }

   /** Get all drivers for a specific season (or current season if null) */
   @Cacheable(cacheNames = CacheConfig.DRIVERS, key = "'all:' + (#season == null ? 'current' : #season)")
   public List<DriverDto> getAllDrivers(Integer season) {
      if (season == null) {
         return driverRepository.findAllByOrderByChampionshipPositionAsc()
               .stream()
               .map(this::toDto)
               .toList();
      }

      List<Driver> allDrivers = driverRepository.findAll();
      List<RaceResult> results = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.RACE);
      List<RaceResult> sprintResults = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.SPRINT);

      Map<Long, List<RaceResult>> resultsByDriver = results.stream()
            .filter(r -> r.getDriver() != null)
            .collect(Collectors.groupingBy(r -> r.getDriver().getId()));

      Map<Long, List<RaceResult>> sprintResultsByDriver = sprintResults.stream()
            .filter(r -> r.getDriver() != null)
            .collect(Collectors.groupingBy(r -> r.getDriver().getId()));

      List<DriverDto> dtoList = new ArrayList<>();
      for (Driver d : allDrivers) {
         List<RaceResult> dResults = resultsByDriver.getOrDefault(d.getId(), Collections.emptyList());
         if (dResults.isEmpty()) {
            continue;
         }
         List<RaceResult> dSprintResults = sprintResultsByDriver.getOrDefault(d.getId(), Collections.emptyList());

         double racePoints = dResults.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
         double sprintPoints = dSprintResults.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0)
               .sum();
         double points = racePoints + sprintPoints;

         int wins = (int) dResults.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();
         int podiums = (int) dResults.stream().filter(r -> r.getPosition() != null && r.getPosition() <= 3).count();

         // ← derive the team from THIS season's results, not the live FK
         com.f1dashboard.entity.Constructor seasonConstructor = dResults.stream()
               .filter(r -> r.getConstructor() != null)
               .reduce((first, second) -> second) // most recent race result that season
               .map(RaceResult::getConstructor)
               .orElseGet(() -> dSprintResults.stream()
                     .filter(r -> r.getConstructor() != null)
                     .reduce((first, second) -> second)
                     .map(RaceResult::getConstructor)
                     .orElse(d.getConstructor())); // last-resort fallback

         DriverDto dto = new DriverDto(
               d.getId(), d.getCode(), d.getFirstName(), d.getLastName(), d.getNumber(),
               d.getNationality(), d.getImageUrl(), points, wins, podiums, 0,
               seasonConstructor != null ? seasonConstructor.getName() : null,
               seasonConstructor != null ? seasonConstructor.getColor() : null);
         dtoList.add(dto);
      }

      dtoList.sort(
            Comparator.comparingDouble(DriverDto::points).reversed()
                  .thenComparing(DriverDto::wins, Comparator.reverseOrder()));

      List<DriverDto> rankedList = new ArrayList<>();
      for (int i = 0; i < dtoList.size(); i++) {
         DriverDto d = dtoList.get(i);
         rankedList.add(new DriverDto(
               d.id(), d.code(), d.firstName(), d.lastName(), d.number(),
               d.nationality(), d.imageUrl(), d.points(), d.wins(), d.podiums(),
               i + 1, d.constructorName(), d.constructorColor()));
      }

      if (rankedList.isEmpty()) {
         return driverRepository.findAllByOrderByChampionshipPositionAsc()
               .stream()
               .map(this::toDto)
               .toList();
      }

      return rankedList;
   }

   /** Get drivers with pagination, ordered by points */
   public Page<DriverDto> getDriversPaginated(Pageable pageable) {
      return driverRepository.findAllByOrderByPointsDesc(pageable)
            .map(this::toDto);
   }

   /** Search drivers by name or code */
   @Cacheable(cacheNames = CacheConfig.DRIVERS, key = "'search:' + #query")
   public List<DriverDto> searchDrivers(String query) {
      return driverRepository.searchDrivers(query)
            .stream()
            .map(this::toDto)
            .toList();
   }

   /** Get detailed driver info by ID */
   @Cacheable(cacheNames = CacheConfig.DRIVERS, key = "'detail:' + #id")
   public DriverDetailDto getDriverById(Long id) {
      Driver driver = driverRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
      return toDetailDto(driver);
   }

   /** Get the championship leader */
   @Cacheable(cacheNames = CacheConfig.DRIVERS, key = "'leader'")
   public DriverDto getChampionshipLeader() {
      Driver leader = driverRepository.findByChampionshipPosition(1);
      return leader != null ? toDto(leader) : null;
   }

   /** Get driver race performance history, penalty notices, and metrics */
   public DriverRaceHistoryDto.HistoryResponse getDriverRaceHistory(Long id, Integer season) {
      int targetSeason = (season != null) ? season : 2026;
      Driver driver = driverRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));

      List<RaceResult> raceResults = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(id, targetSeason, SessionType.RACE);

      List<DriverRaceHistoryDto.RaceEntry> entries = new ArrayList<>();
      int totalGrid = 0;
      int gridCount = 0;
      int totalFinish = 0;
      int finishCount = 0;
      int totalDelta = 0;
      int dnfs = 0;
      int fastestLaps = 0;
      int pointsRaces = 0;
      Integer bestFinish = null;
      Integer bestGrid = null;

      for (RaceResult r : raceResults) {
         int grid = (r.getGridPosition() != null) ? r.getGridPosition() : 0;
         int finish = (r.getPosition() != null) ? r.getPosition() : 0;
         int delta = (grid > 0 && finish > 0) ? (grid - finish) : 0;

         if (grid > 0) {
            totalGrid += grid;
            gridCount++;
            bestGrid = (bestGrid == null) ? grid : Math.min(bestGrid, grid);
         }

         if (finish > 0) {
            totalFinish += finish;
            finishCount++;
            bestFinish = (bestFinish == null) ? finish : Math.min(bestFinish, finish);
         }

         totalDelta += delta;

         if ("DNF".equalsIgnoreCase(r.getStatus()) || "Retired".equalsIgnoreCase(r.getStatus())) {
            dnfs++;
         }

         if (Boolean.TRUE.equals(r.getFastestLap())) {
            fastestLaps++;
         }

         if (r.getPoints() != null && r.getPoints() > 0) {
            pointsRaces++;
         }

         entries.add(new DriverRaceHistoryDto.RaceEntry(
               r.getRace().getId(),
               r.getRace().getRound(),
               r.getRace().getName(),
               r.getRace().getCircuit() != null ? r.getRace().getCircuit().getName() : null,
               r.getRace().getCircuit() != null ? r.getRace().getCircuit().getCountry() : null,
               r.getRace().getRaceDate(),
               grid,
               finish,
               r.getPoints() != null ? r.getPoints() : 0.0,
               r.getStatus(),
               Boolean.TRUE.equals(r.getFastestLap()),
               delta,
               "RACE"
         ));
      }

      int totalCompletedRaces = entries.size();
      double avgGrid = gridCount > 0 ? Math.round(((double) totalGrid / gridCount) * 10.0) / 10.0 : 0.0;
      double avgFinish = finishCount > 0 ? Math.round(((double) totalFinish / finishCount) * 10.0) / 10.0 : 0.0;
      double pointsRate = totalCompletedRaces > 0
            ? Math.round(((double) pointsRaces / totalCompletedRaces) * 1000.0) / 10.0
            : 0.0;

      DriverRaceHistoryDto.PerformanceStats stats = new DriverRaceHistoryDto.PerformanceStats(
            avgGrid,
            avgFinish,
            totalDelta,
            totalCompletedRaces,
            pointsRaces,
            pointsRate,
            dnfs,
            fastestLaps,
            bestFinish != null ? bestFinish : 0,
            bestGrid != null ? bestGrid : 0
      );

      // Fetch stewards and penalty notices from OpenF1 telemetry
      List<DriverRaceHistoryDto.PenaltyEvent> penalties = fetchDriverPenalties(driver, targetSeason, raceResults);

      return new DriverRaceHistoryDto.HistoryResponse(
            driver.getId(),
            driver.getCode(),
            driver.getFirstName() + " " + driver.getLastName(),
            targetSeason,
            stats,
            entries,
            penalties
      );
   }

   private Map<Long, OpenF1Session> getSeasonSessions(int season) {
      Long expiry = sessionsCacheExpiry.get(season);
      if (expiry != null && System.currentTimeMillis() < expiry && seasonSessionsCache.containsKey(season)) {
         return seasonSessionsCache.get(season);
      }

      Map<Long, OpenF1Session> sessionMap = new HashMap<>();
      try {
         String url = OPENF1_BASE_URL + "/sessions?year=" + season;
         JsonNode[] sessions = restTemplate.getForObject(url, JsonNode[].class);
         if (sessions != null) {
            for (JsonNode s : sessions) {
               long sKey = s.path("session_key").asLong(0);
               if (sKey > 0) {
                  sessionMap.put(sKey, new OpenF1Session(
                        sKey,
                        s.path("meeting_key").asLong(0),
                        s.path("session_name").asText("Race"),
                        s.path("circuit_short_name").asText(""),
                        s.path("country_name").asText(""),
                        s.path("location").asText("")
                  ));
               }
            }
         }
         seasonSessionsCache.put(season, sessionMap);
         sessionsCacheExpiry.put(season, System.currentTimeMillis() + (60 * 60 * 1000L)); // 1 hour TTL
      } catch (Exception e) {
         log.warn("Could not fetch OpenF1 sessions for season {}: {}", season, e.getMessage());
         return seasonSessionsCache.getOrDefault(season, Collections.emptyMap());
      }
      return sessionMap;
   }

   private List<JsonNode> getSeasonRaceControl(int season) {
      Long expiry = raceControlCacheExpiry.get(season);
      if (expiry != null && System.currentTimeMillis() < expiry && seasonRaceControlCache.containsKey(season)) {
         return seasonRaceControlCache.get(season);
      }

      List<JsonNode> messages = new ArrayList<>();
      try {
         String url = OPENF1_BASE_URL + "/race_control?date>=" + season + "-01-01";
         JsonNode[] response = restTemplate.getForObject(url, JsonNode[].class);
         if (response != null) {
            messages = Arrays.asList(response);
         }
         seasonRaceControlCache.put(season, messages);
         raceControlCacheExpiry.put(season, System.currentTimeMillis() + (15 * 60 * 1000L)); // 15 min TTL
      } catch (HttpClientErrorException.NotFound e) {
         log.info("No OpenF1 race control data found for season {}", season);
         seasonRaceControlCache.put(season, Collections.emptyList());
         raceControlCacheExpiry.put(season, System.currentTimeMillis() + (15 * 60 * 1000L));
         return Collections.emptyList();
      } catch (Exception e) {
         log.warn("Could not fetch OpenF1 race control for season {}: {}", season, e.getMessage());
         return seasonRaceControlCache.getOrDefault(season, Collections.emptyList());
      }
      return messages;
   }

   private boolean messageMatchesDriver(Driver driver, JsonNode node, String text) {
      if (text == null) return false;
      Integer driverNum = driver.getNumber();
      String driverCode = driver.getCode();

      // 1. Direct driver_number field check
      JsonNode dnNode = node.path("driver_number");
      if (!dnNode.isMissingNode() && !dnNode.isNull() && driverNum != null) {
         if (dnNode.asInt() == driverNum) {
            return true;
         }
      }

      // 2. Driver code in brackets or word boundary, e.g. "CAR 12 (ANT)" or "(ANT)"
      if (driverCode != null && !driverCode.isBlank()) {
         String upperCode = driverCode.toUpperCase();
         if (text.contains("(" + upperCode + ")") || text.matches("(?i).*\\b" + upperCode + "\\b.*")) {
            return true;
         }
      }

      // 3. Car number matching in message: "CAR 12" or "CARS ..., 12,"
      if (driverNum != null) {
         Pattern carPattern = Pattern.compile("(?i)\\bCAR(?:S)?\\s+" + driverNum + "\\b");
         if (carPattern.matcher(text).find()) {
            return true;
         }
      }

      return false;
   }

   private List<DriverRaceHistoryDto.PenaltyEvent> fetchDriverPenalties(
         Driver driver,
         Integer season,
         List<RaceResult> raceResults
   ) {
      if (season == null) return Collections.emptyList();

      List<JsonNode> rcMessages = getSeasonRaceControl(season);
      if (rcMessages.isEmpty()) {
         return Collections.emptyList();
      }

      Map<Long, OpenF1Session> sessionsMap = getSeasonSessions(season);

      // Build mapping from location / country to database race info (round and raceName)
      Map<String, Integer> locationToRound = new HashMap<>();
      Map<String, String> locationToRaceName = new HashMap<>();
      for (RaceResult r : raceResults) {
         if (r.getRace() != null) {
            Integer round = r.getRace().getRound();
            String name = r.getRace().getName();
            if (round != null && name != null) {
               if (r.getRace().getCircuit() != null) {
                  String loc = r.getRace().getCircuit().getLocation();
                  if (loc != null) {
                     locationToRound.put(loc.toLowerCase(), round);
                     locationToRaceName.put(loc.toLowerCase(), name);
                  }
                  String country = r.getRace().getCircuit().getCountry();
                  if (country != null) {
                     locationToRound.put(country.toLowerCase(), round);
                     locationToRaceName.put(country.toLowerCase(), name);
                  }
               }
            }
         }
      }

      List<DriverRaceHistoryDto.PenaltyEvent> penalties = new ArrayList<>();
      Set<String> seen = new HashSet<>();

      for (JsonNode node : rcMessages) {
         String text = node.path("message").asText("");
         if (text.isBlank()) continue;

         if (!messageMatchesDriver(driver, node, text)) {
            continue;
         }

         // Exclude warnings, reprimands, lap time deletions, or "no further action"
         if (EXCLUSION_PATTERN.matcher(text).find()) {
            continue;
         }

         // Split into the penalty action part (before the " - ") and the reason part.
         // This is critical: "DRIVE THROUGH PENALTY ... - FAILING TO SERVE TIME PENALTY"
         // must not be classified as TIME_PENALTY just because the reason mentions it.
         int dashIdx = text.indexOf(" - ");
         String penaltyPart = (dashIdx > 0) ? text.substring(0, dashIdx) : text;

         String penaltyType = null;
         String penaltyDetail = null;

         // Check DRIVE_THROUGH first (before TIME_PENALTY) to avoid false matches
         Matcher dtMatcher = DRIVE_THROUGH_PATTERN.matcher(penaltyPart);
         if (dtMatcher.find()) {
            penaltyType = "DRIVE_THROUGH";
            penaltyDetail = "Drive through penalty";
         } else {
            Matcher pitMatcher = PITLANE_START_PATTERN.matcher(penaltyPart);
            if (pitMatcher.find()) {
               penaltyType = "PITLANE_START";
               penaltyDetail = "Pit lane start";
            } else {
               Matcher gridMatcher = GRID_PENALTY_PATTERN.matcher(penaltyPart);
               if (gridMatcher.find()) {
                  penaltyType = "GRID_PENALTY";
                  penaltyDetail = (gridMatcher.group(1) != null)
                        ? gridMatcher.group(1) + " place grid drop"
                        : "Grid drop";
               } else {
                  // TIME_PENALTY: match against penaltyPart only
                  Matcher timeMatcher = TIME_PENALTY_PATTERN.matcher(penaltyPart);
                  if (timeMatcher.find()) {
                     penaltyType = "TIME_PENALTY";
                     // group(1) = seconds from "X TIME PENALTY", group(2) = seconds from "X SECOND PENALTY"
                     String seconds = timeMatcher.group(1) != null ? timeMatcher.group(1) : timeMatcher.group(2);
                     penaltyDetail = (seconds != null)
                           ? seconds + " second time penalty"
                           : "Time penalty";
                  }
               }
            }
         }

         if (penaltyType == null) {
            // Did not match the 4 requested penalty types
            continue;
         }

         long sessionKey = node.path("session_key").asLong(0);
         OpenF1Session session = sessionsMap.get(sessionKey);

         String sessionName = (session != null) ? session.sessionName() : "Grand Prix";
         if ("Race".equalsIgnoreCase(sessionName)) {
            sessionName = "Grand Prix";
         }

         String raceName = "Grand Prix";
         Integer round = 0;
         if (session != null) {
            String loc = session.location() != null ? session.location().toLowerCase() : "";
            String country = session.countryName() != null ? session.countryName().toLowerCase() : "";
            if (locationToRaceName.containsKey(loc)) {
               raceName = locationToRaceName.get(loc);
               round = locationToRound.getOrDefault(loc, 0);
            } else if (locationToRaceName.containsKey(country)) {
               raceName = locationToRaceName.get(country);
               round = locationToRound.getOrDefault(country, 0);
            } else if (session.circuitShortName() != null && !session.circuitShortName().isBlank()) {
               raceName = session.circuitShortName() + " Grand Prix";
            } else if (!session.location().isBlank()) {
               raceName = session.location() + " Grand Prix";
            }
         }

         // For "FIA STEWARDS:" announcements, the OpenF1 lap_number is the announcement lap,
         // NOT the incident lap. Try to extract an explicit "LAP <N>" from the reason text,
         // otherwise use 0 (which the frontend hides) to avoid displaying a wrong lap number.
         int lapNumber = 0;
         if (dashIdx > 0) {
            String reasonPart = text.substring(dashIdx + 3); // after " - "
            java.util.regex.Matcher lapMatcher = Pattern.compile("\\bLAP\\s+(\\d+)\\b", Pattern.CASE_INSENSITIVE).matcher(reasonPart);
            if (lapMatcher.find()) {
               lapNumber = Integer.parseInt(lapMatcher.group(1));
            }
         }
         String timestamp = node.path("date").asText(null);

         // Deduplicate: same session + same penalty type + same penalty detail = same penalty.
         // Using sessionKey+penaltyType+penaltyDetail (not lap number) so the announcement lap
         // and the incident lap don't produce two entries for the same penalty decision.
         String dedupeKey = sessionKey + ":" + penaltyType + ":" + penaltyDetail;
         if (!seen.add(dedupeKey)) {
            continue;
         }

         penalties.add(new DriverRaceHistoryDto.PenaltyEvent(
               raceName,
               sessionName,
               round,
               lapNumber,
               "Penalty",
               penaltyType,
               penaltyDetail,
               text,
               "PENALTY",
               timestamp
         ));
      }

      return penalties;
   }

   // ---- Mapping methods ----

   public DriverDto toDto(Driver d) {
      return new DriverDto(
            d.getId(),
            d.getCode(),
            d.getFirstName(),
            d.getLastName(),
            d.getNumber(),
            d.getNationality(),
            d.getImageUrl(),
            d.getPoints(),
            d.getWins(),
            d.getPodiums(),
            d.getChampionshipPosition(),
            d.getConstructor() != null ? d.getConstructor().getName() : null,
            d.getConstructor() != null ? d.getConstructor().getColor() : null);
   }

   private DriverDetailDto toDetailDto(Driver d) {
      return new DriverDetailDto(
            d.getId(),
            d.getCode(),
            d.getFirstName(),
            d.getLastName(),
            d.getNumber(),
            d.getDateOfBirth(),
            d.getNationality(),
            d.getImageUrl(),
            d.getPoints(),
            d.getWins(),
            d.getPodiums(),
            d.getChampionshipPosition(),
            d.getConstructor() != null ? d.getConstructor().getName() : null,
            d.getConstructor() != null ? d.getConstructor().getColor() : null,
            d.getConstructor() != null ? d.getConstructor().getId() : null);
   }
}
