package com.f1dashboard.service;

import com.f1dashboard.dto.ConsistencyDto;
import com.f1dashboard.dto.DriverComparisonDto;
import com.f1dashboard.dto.ConstructorComparisonDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.dto.ConstructorDto;
import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.dto.MomentumDto;
import com.f1dashboard.dto.TimelineDto;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.entity.Constructor;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.RaceResultRepository;
import com.f1dashboard.repository.ConstructorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

   private final DriverRepository driverRepository;
   private final RaceRepository raceRepository;
   private final RaceResultRepository raceResultRepository;
   private final ConstructorRepository constructorRepository;
   private final DriverService driverService;
   private final ConstructorService constructorService;

   @Cacheable(cacheNames = CacheConfig.ANALYTICS, key = "'compareDrivers:' + #driverAId + ':' + #driverBId + ':' + #season")
   public DriverComparisonDto compareDrivers(Long driverAId, Long driverBId, Integer season) {
      Driver driverA = driverRepository.findById(driverAId)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverAId));
      Driver driverB = driverRepository.findById(driverBId)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverBId));

      DriverComparisonDto dto = new DriverComparisonDto();

      List<RaceResult> resultsA = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverAId, season, SessionType.RACE);
      List<RaceResult> resultsB = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverBId, season, SessionType.RACE);

      List<RaceResult> sprintResultsA = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverAId, season, SessionType.SPRINT);
      List<RaceResult> sprintResultsB = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverBId, season, SessionType.SPRINT);

      // ← season-scoped constructor instead of the live FK
      dto.setDriverA(toSeasonScopedDriverDto(driverA, resultsA, sprintResultsA));
      dto.setDriverB(toSeasonScopedDriverDto(driverB, resultsB, sprintResultsB));

      dto.setStatsA(computeComparisonStats(driverA, resultsA, sprintResultsA));
      dto.setStatsB(computeComparisonStats(driverB, resultsB, sprintResultsB));

      // ... rest of the method (h2h/race loop etc.) stays exactly the same,
      // just delete the old resultsA/resultsB/sprintResultsA/sprintResultsB
      // declarations further down since they're now declared above.

      // Group by race to compute H2H and race-by-race data
      Map<Long, RaceResult> mapA = resultsA.stream().collect(Collectors.toMap(r -> r.getRace().getId(), r -> r));
      Map<Long, RaceResult> mapB = resultsB.stream().collect(Collectors.toMap(r -> r.getRace().getId(), r -> r));

      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(season);

      int h2hRaceA = 0;
      int h2hRaceB = 0;
      int cumPointsA = 0;
      int cumPointsB = 0;

      List<DriverComparisonDto.RaceComparisonDto> raceDtos = new ArrayList<>();

      for (Race race : races) {
         RaceResult resA = mapA.get(race.getId());
         RaceResult resB = mapB.get(race.getId());

         DriverComparisonDto.RaceComparisonDto rDto = new DriverComparisonDto.RaceComparisonDto();
         rDto.setRaceName(race.getName());
         rDto.setRound(race.getRound());

         if (resA != null) {
            rDto.setPosA(resA.getPosition());
            cumPointsA += resA.getPoints();
         }
         if (resB != null) {
            rDto.setPosB(resB.getPosition());
            cumPointsB += resB.getPoints();
         }

         rDto.setCumulativePointsA(cumPointsA);
         rDto.setCumulativePointsB(cumPointsB);

         if (resA != null && resB != null && resA.getPosition() != null && resB.getPosition() != null) {
            if (resA.getPosition() < resB.getPosition()) {
               h2hRaceA++;
            } else if (resB.getPosition() < resA.getPosition()) {
               h2hRaceB++;
            }
         }
         raceDtos.add(rDto);
      }

      dto.setHeadToHeadRaceA(h2hRaceA);
      dto.setHeadToHeadRaceB(h2hRaceB);
      dto.setRaces(raceDtos);

      // Note: Qualifying H2H can be added similarly by fetching
      // SessionType.QUALIFYING
      dto.setHeadToHeadQualiA(0);
      dto.setHeadToHeadQualiB(0);

      return dto;
   }

   private DriverDto toSeasonScopedDriverDto(Driver driver, List<RaceResult> results, List<RaceResult> sprintResults) {
      Constructor seasonConstructor = results.stream()
            .filter(r -> r.getConstructor() != null)
            .reduce((first, second) -> second) // most recent race result that season
            .map(RaceResult::getConstructor)
            .orElseGet(() -> sprintResults.stream()
                  .filter(r -> r.getConstructor() != null)
                  .reduce((first, second) -> second)
                  .map(RaceResult::getConstructor)
                  .orElse(driver.getConstructor())); // last-resort fallback

      return new DriverDto(
            driver.getId(), driver.getCode(), driver.getFirstName(), driver.getLastName(),
            driver.getNumber(), driver.getNationality(), driver.getImageUrl(),
            driver.getPoints(), driver.getWins(), driver.getPodiums(), driver.getChampionshipPosition(),
            seasonConstructor != null ? seasonConstructor.getName() : null,
            seasonConstructor != null ? seasonConstructor.getColor() : null);
   }

   private DriverComparisonDto.ComparisonStats computeComparisonStats(Driver driver, List<RaceResult> results,
         List<RaceResult> sprintResults) {
      DriverComparisonDto.ComparisonStats stats = new DriverComparisonDto.ComparisonStats();

      double racePoints = results.stream()
            .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0)
            .sum();
      double sprintPoints = sprintResults.stream()
            .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0)
            .sum();

      int raceWins = (int) results.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() == 1)
            .count();
      int sprintWins = (int) sprintResults.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() == 1)
            .count();

      int racePodiums = (int) results.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() <= 3)
            .count();

      stats.setPoints(racePoints + sprintPoints);
      stats.setWins(raceWins); // wins traditionally refers to race wins only, not sprint wins — adjust if your
                               // app counts differently
      stats.setPodiums(racePodiums); // podiums traditionally refers to race podiums only — adjust if you want sprint
                                     // podiums included

      int totalGrid = 0;
      int gridCount = 0;
      int totalFinish = 0;
      int finishCount = 0;
      int dnfs = 0;

      for (RaceResult r : results) {
         if (r.getGridPosition() != null && r.getGridPosition() > 0) {
            totalGrid += r.getGridPosition();
            gridCount++;
         }
         if (r.getPosition() != null && r.getPosition() > 0) {
            totalFinish += r.getPosition();
            finishCount++;
         }
         if ("DNF".equalsIgnoreCase(r.getStatus()) || "Retired".equalsIgnoreCase(r.getStatus())) {
            dnfs++;
         }
      }

      stats.setAvgGrid(gridCount > 0 ? (double) totalGrid / gridCount : 0);
      stats.setAvgFinish(finishCount > 0 ? (double) totalFinish / finishCount : 0);
      stats.setDnfs(dnfs);
      return stats;
   }

   @Cacheable(cacheNames = CacheConfig.ANALYTICS, key = "'momentum:' + #driverId + ':' + #range + ':' + #season")
   public MomentumDto getDriverMomentum(Long driverId, String range, Integer season) {
      Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

      List<RaceResult> allResults = raceResultRepository
            .findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverId, season, SessionType.RACE);
      allResults.sort(Comparator.comparing(r -> r.getRace().getRound()));

      MomentumDto dto = new MomentumDto();
      dto.setDriver(driverService.toDto(driver));

      int size = allResults.size();
      String normalizedRange = range == null ? "LAST_10" : range.toUpperCase();

      int startIndex;
      int endIndexExclusive;
      switch (normalizedRange) {
         case "FIRST_10":
            startIndex = 0;
            endIndexExclusive = Math.min(10, size);
            break;
         case "ALL":
            startIndex = 0;
            endIndexExclusive = size;
            break;
         case "LAST_10":
         default:
            endIndexExclusive = size;
            startIndex = Math.max(0, size - 10);
            break;
      }

      List<MomentumDto.RaceMomentum> recentRaces = new ArrayList<>();
      final int rollingWindow = 3; // fixed trend-line window, independent of the selected range

      for (int i = startIndex; i < endIndexExclusive; i++) {
         RaceResult r = allResults.get(i);
         MomentumDto.RaceMomentum rm = new MomentumDto.RaceMomentum();
         rm.setRaceName(r.getRace().getName());
         rm.setRound(r.getRace().getRound());
         rm.setGridPosition(r.getGridPosition() != null ? r.getGridPosition() : 0);
         rm.setFinishPosition(r.getPosition() != null ? r.getPosition() : 20); // Fallback for DNF
         rm.setPositionDelta(
               rm.getGridPosition() > 0 && rm.getFinishPosition() > 0 ? rm.getGridPosition() - rm.getFinishPosition()
                     : 0);
         rm.setPoints(r.getPoints() != null ? r.getPoints() : 0.0);

         // Rolling avg logic — always looks back within the selected slice only
         double sumFinish = 0;
         double sumPoints = 0;
         int count = 0;
         int rollStart = Math.max(startIndex, i - rollingWindow + 1);
         for (int j = rollStart; j <= i; j++) {
            sumFinish += allResults.get(j).getPosition() != null ? allResults.get(j).getPosition() : 20;
            sumPoints += allResults.get(j).getPoints();
            count++;
         }
         rm.setRollingAvgFinish(count > 0 ? sumFinish / count : 0);
         rm.setRollingAvgPoints(count > 0 ? sumPoints / count : 0);

         recentRaces.add(rm);
      }
      dto.setRecentRaces(recentRaces);

      // Calculate score
      if (recentRaces.isEmpty()) {
         dto.setScore(50);
         dto.setFormTrend("NEUTRAL");
      } else {
         double avgPoints = recentRaces.stream().mapToDouble(MomentumDto.RaceMomentum::getPoints).average().orElse(0);
         int score = (int) Math.min(100, Math.max(0, (avgPoints / 25.0) * 100));
         dto.setScore(score);
         if (score > 70)
            dto.setFormTrend("HOT");
         else if (score < 30)
            dto.setFormTrend("COLD");
         else
            dto.setFormTrend("NEUTRAL");
      }

      return dto;
   }

   @Cacheable(cacheNames = CacheConfig.ANALYTICS, key = "'consistency:' + #season")
   public ConsistencyDto getConsistencyAnalytics(Integer season) {
      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(season);
      List<String> raceNames = races.stream().map(Race::getName).collect(Collectors.toList());

      List<Driver> allDrivers = driverRepository.findAllByOrderByChampionshipPositionAsc();
      List<RaceResult> allResults = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.RACE);

      // Group by driver
      Map<Long, List<RaceResult>> resultsByDriver = allResults.stream()
            .collect(Collectors.groupingBy(r -> r.getDriver().getId()));

      List<ConsistencyDto.DriverConsistency> driverConsistencies = new ArrayList<>();

      for (Driver d : allDrivers) {
         List<RaceResult> dResults = resultsByDriver.getOrDefault(d.getId(), Collections.emptyList());
         if (dResults.isEmpty())
            continue;

         ConsistencyDto.DriverConsistency dc = new ConsistencyDto.DriverConsistency();
         dc.setDriver(driverService.toDto(d));

         int pointFinishes = 0;
         double sumPos = 0;
         int count = 0;
         Map<String, String> raceResMap = new LinkedHashMap<>();

         for (RaceResult r : dResults) {
            if (r.getPoints() > 0)
               pointFinishes++;
            if (r.getPosition() != null && r.getPosition() > 0) {
               sumPos += r.getPosition();
               count++;
            }
            boolean isDnf = "DNF".equalsIgnoreCase(r.getStatus()) || "Retired".equalsIgnoreCase(r.getStatus());
            String resStr = isDnf
                  ? "DNF"
                  : (r.getPosition() != null && r.getPosition() > 0 ? String.valueOf(r.getPosition()) : "DNF");
            raceResMap.put(r.getRace().getName(), resStr);
         }

         dc.setResultsByRace(raceResMap);
         dc.setPointsFinishRate(dResults.size() > 0 ? ((double) pointFinishes / dResults.size()) * 100 : 0);

         double avgPos = count > 0 ? sumPos / count : 0;
         dc.setAvgFinishPosition(avgPos);

         // Standard deviation
         double sumSq = 0;
         for (RaceResult r : dResults) {
            if (r.getPosition() != null && r.getPosition() > 0) {
               sumSq += Math.pow(r.getPosition() - avgPos, 2);
            }
         }
         dc.setStdDevPosition(count > 1 ? Math.sqrt(sumSq / (count - 1)) : 0);

         driverConsistencies.add(dc);
      }

      ConsistencyDto dto = new ConsistencyDto();
      dto.setRaces(raceNames);
      dto.setDrivers(driverConsistencies);

      return dto;
   }

   @Cacheable(cacheNames = CacheConfig.ANALYTICS, key = "'compareConstructors:' + #teamAId + ':' + #teamBId + ':' + #season")
   public ConstructorComparisonDto getConstructorComparison(Long teamAId, Long teamBId, Integer season) {
      Constructor teamA = constructorRepository.findById(teamAId)
            .orElseThrow(() -> new ResourceNotFoundException("Constructor", "id", teamAId));
      Constructor teamB = constructorRepository.findById(teamBId)
            .orElseThrow(() -> new ResourceNotFoundException("Constructor", "id", teamBId));

      ConstructorComparisonDto dto = new ConstructorComparisonDto();

      List<RaceResult> resultsA = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamAId, season, SessionType.RACE);
      List<RaceResult> resultsB = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamBId, season, SessionType.RACE);
      List<RaceResult> sprintA = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamAId, season, SessionType.SPRINT);
      List<RaceResult> sprintB = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamBId, season, SessionType.SPRINT);
      List<RaceResult> qualiA = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamAId, season, SessionType.QUALIFYING);
      List<RaceResult> qualiB = raceResultRepository
            .findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(teamBId, season, SessionType.QUALIFYING);

      // ── ADD the new block here — derive the season's actual roster from results ──
      List<Driver> driversA = resultsA.stream()
            .map(RaceResult::getDriver)
            .distinct()
            .sorted(Comparator.comparing(
                  d -> d.getChampionshipPosition() == null ? Integer.MAX_VALUE : d.getChampionshipPosition()))
            .toList();
      List<Driver> driversB = resultsB.stream()
            .map(RaceResult::getDriver)
            .distinct()
            .sorted(Comparator.comparing(
                  d -> d.getChampionshipPosition() == null ? Integer.MAX_VALUE : d.getChampionshipPosition()))
            .toList();

      // Compute season-scoped points/wins for the summary cards (instead of live
      // entity totals)
      double seasonPointsA = resultsA.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum()
            + sprintA.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
      double seasonPointsB = resultsB.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum()
            + sprintB.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
      int seasonWinsA = (int) resultsA.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();
      int seasonWinsB = (int) resultsB.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();

      dto.setTeamA(new ConstructorDto(teamA.getId(), teamA.getName(), teamA.getNationality(),
            teamA.getLogoUrl(), teamA.getColor(), seasonPointsA, seasonWinsA, 0));
      dto.setTeamB(new ConstructorDto(teamB.getId(), teamB.getName(), teamB.getNationality(),
            teamB.getLogoUrl(), teamB.getColor(), seasonPointsB, seasonWinsB, 0));

      dto.setDriverSplitA(computeDriverSplits(driversA, resultsA, qualiA, seasonPointsA));
      dto.setDriverSplitB(computeDriverSplits(driversB, resultsB, qualiB, seasonPointsB));

      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(season);
      List<ConstructorComparisonDto.RoundComparison> rounds = new ArrayList<>();

      double cumPointsA = 0;
      double cumPointsB = 0;

      for (Race race : races) {
         ConstructorComparisonDto.RoundComparison rc = new ConstructorComparisonDto.RoundComparison();
         rc.setRaceName(race.getName());
         rc.setRound(race.getRound());

         double roundPtsA = 0;
         List<ConstructorComparisonDto.DriverPoints> dpA = new ArrayList<>();
         for (Driver d : driversA) {
            double pts = resultsA.stream()
                  .filter(r -> r.getRace().getId().equals(race.getId()) && r.getDriver().getId().equals(d.getId()))
                  .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
            roundPtsA += pts;
            dpA.add(new ConstructorComparisonDto.DriverPoints(d.getCode(), pts));
         }
         rc.setPointsA(roundPtsA);
         rc.setDriverPointsA(dpA);
         cumPointsA += roundPtsA;
         rc.setCumulativePointsA(cumPointsA);

         double roundPtsB = 0;
         List<ConstructorComparisonDto.DriverPoints> dpB = new ArrayList<>();
         for (Driver d : driversB) {
            double pts = resultsB.stream()
                  .filter(r -> r.getRace().getId().equals(race.getId()) && r.getDriver().getId().equals(d.getId()))
                  .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
            roundPtsB += pts;
            dpB.add(new ConstructorComparisonDto.DriverPoints(d.getCode(), pts));
         }
         rc.setPointsB(roundPtsB);
         rc.setDriverPointsB(dpB);
         cumPointsB += roundPtsB;
         rc.setCumulativePointsB(cumPointsB);

         rc.setGap(cumPointsA - cumPointsB);
         rounds.add(rc);
      }

      dto.setRounds(rounds);
      return dto;
   }

   private List<ConstructorComparisonDto.DriverPointSplit> computeDriverSplits(List<Driver> drivers,
         List<RaceResult> raceResults, List<RaceResult> qualiResults, Double totalTeamPts) {
      List<ConstructorComparisonDto.DriverPointSplit> splits = new ArrayList<>();
      double safeTotal = totalTeamPts != null && totalTeamPts > 0 ? totalTeamPts : 1;

      for (Driver d : drivers) {
         ConstructorComparisonDto.DriverPointSplit split = new ConstructorComparisonDto.DriverPointSplit();
         split.setDriver(driverService.toDto(d));

         double dPts = raceResults.stream().filter(r -> r.getDriver().getId().equals(d.getId()))
               .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
         split.setPoints(dPts);
         split.setPercentage((dPts / safeTotal) * 100);

         double avgQ = qualiResults.stream()
               .filter(r -> r.getDriver().getId().equals(d.getId()) && r.getPosition() != null && r.getPosition() > 0)
               .mapToInt(RaceResult::getPosition).average().orElse(0);
         split.setAvgQuali(avgQ);

         double avgR = raceResults.stream()
               .filter(r -> r.getDriver().getId().equals(d.getId()) && r.getPosition() != null && r.getPosition() > 0)
               .mapToInt(RaceResult::getPosition).average().orElse(0);
         split.setAvgRace(avgR);

         splits.add(split);
      }
      return splits;
   }

   @Cacheable(cacheNames = CacheConfig.ANALYTICS, key = "'timeline:' + #season")
   public TimelineDto getSeasonTimeline(Integer season) {
      List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(season);
      List<RaceResult> allRaceResults = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.RACE);

      // Group race results by race id
      Map<Long, List<RaceResult>> resultsByRace = allRaceResults.stream()
            .collect(Collectors.groupingBy(r -> r.getRace().getId()));

      List<TimelineDto.TimelineEvent> events = new ArrayList<>();
      List<TimelineDto.GapDataPoint> gapEvolution = new ArrayList<>();

      // Track cumulative points across rounds
      Map<Long, Double> cumulativePoints = new LinkedHashMap<>();
      String prevLeaderCode = null;

      for (Race race : races) {
         TimelineDto.TimelineEvent event = new TimelineDto.TimelineEvent();
         event.setRound(race.getRound());
         event.setRaceName(race.getName());
         event.setCountry(race.getCircuit().getCountry());
         event.setDate(race.getRaceDate());
         event.setStatus(race.getStatus().name());

         List<RaceResult> raceResults = resultsByRace.getOrDefault(race.getId(), Collections.emptyList());
         List<String> keyEvents = new ArrayList<>();

         if (race.getStatus() == RaceStatus.COMPLETED && !raceResults.isEmpty()) {
            // Find winner (position 1)
            RaceResult winner = raceResults.stream()
                  .filter(r -> r.getPosition() != null && r.getPosition() == 1)
                  .findFirst().orElse(null);

            if (winner != null) {
               event.setWinner(winner.getDriver().getFirstName() + " " + winner.getDriver().getLastName());
               event.setWinnerCode(winner.getDriver().getCode());
               event.setWinnerConstructor(winner.getDriver().getConstructor().getName());
               event.setWinnerConstructorColor(winner.getDriver().getConstructor().getColor());
            }

            // Update cumulative points
            for (RaceResult rr : raceResults) {
               Long dId = rr.getDriver().getId();
               double pts = rr.getPoints() != null ? rr.getPoints() : 0;
               cumulativePoints.merge(dId, pts, Double::sum);
            }

            // Find DNFs
            long dnfCount = raceResults.stream()
                  .filter(r -> "DNF".equalsIgnoreCase(r.getStatus()) || "Retired".equalsIgnoreCase(r.getStatus()))
                  .count();
            if (dnfCount > 0) {
               keyEvents.add(dnfCount + " retirement" + (dnfCount > 1 ? "s" : ""));
            }

            // Biggest mover (most positions gained)
            raceResults.stream()
                  .filter(r -> r.getGridPosition() != null && r.getPosition() != null && r.getGridPosition() > 0
                        && r.getPosition() > 0)
                  .max(Comparator.comparingInt(r -> r.getGridPosition() - r.getPosition()))
                  .ifPresent(r -> {
                     int gain = r.getGridPosition() - r.getPosition();
                     if (gain >= 5) {
                        keyEvents.add(r.getDriver().getCode() + " gained " + gain + " places");
                     }
                  });

            // Championship leader after this round
            if (!cumulativePoints.isEmpty()) {
               Map.Entry<Long, Double> leaderEntry = cumulativePoints.entrySet().stream()
                     .max(Map.Entry.comparingByValue()).orElse(null);

               if (leaderEntry != null) {
                  Driver leader = driverRepository.findById(leaderEntry.getKey()).orElse(null);
                  if (leader != null) {
                     event.setChampionshipLeader(leader.getFirstName() + " " + leader.getLastName());
                     event.setChampionshipLeaderCode(leader.getCode());
                     event.setLeaderPoints(leaderEntry.getValue());

                     // Check lead change
                     if (prevLeaderCode != null && !leader.getCode().equals(prevLeaderCode)) {
                        event.setLeadChanged(true);
                        keyEvents.add("Championship lead changes to " + leader.getCode());
                     }
                     prevLeaderCode = leader.getCode();

                     // Gap to second
                     double secondPoints = cumulativePoints.values().stream()
                           .sorted(Comparator.reverseOrder())
                           .skip(1).findFirst().orElse(0.0);
                     event.setGapToSecond(leaderEntry.getValue() - secondPoints);

                     // Gap evolution data
                     TimelineDto.GapDataPoint gap = new TimelineDto.GapDataPoint();
                     gap.setRound(race.getRound());
                     gap.setRaceName(race.getName());
                     gap.setGap(leaderEntry.getValue() - secondPoints);
                     gapEvolution.add(gap);
                  }
               }
            }
         }

         event.setKeyEvents(keyEvents);
         events.add(event);
      }

      TimelineDto dto = new TimelineDto();
      dto.setEvents(events);
      dto.setGapEvolution(gapEvolution);
      return dto;
   }
}
