package com.f1dashboard.service;

import com.f1dashboard.dto.ConsistencyDto;
import com.f1dashboard.dto.DriverComparisonDto;
import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.dto.MomentumDto;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.Race;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceRepository;
import com.f1dashboard.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
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
    private final DriverService driverService;

    public DriverComparisonDto compareDrivers(Long driverAId, Long driverBId, Integer season) {
        Driver driverA = driverRepository.findById(driverAId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverAId));
        Driver driverB = driverRepository.findById(driverBId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverBId));

        DriverComparisonDto dto = new DriverComparisonDto();
        dto.setDriverA(driverService.toDto(driverA));
        dto.setDriverB(driverService.toDto(driverB));

        // Get Race results for season
        List<RaceResult> resultsA = raceResultRepository.findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverAId, season, SessionType.RACE);
        List<RaceResult> resultsB = raceResultRepository.findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverBId, season, SessionType.RACE);

        dto.setStatsA(computeComparisonStats(driverA, resultsA));
        dto.setStatsB(computeComparisonStats(driverB, resultsB));

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
        
        // Note: Qualifying H2H can be added similarly by fetching SessionType.QUALIFYING
        dto.setHeadToHeadQualiA(0);
        dto.setHeadToHeadQualiB(0);

        return dto;
    }

    private DriverComparisonDto.ComparisonStats computeComparisonStats(Driver driver, List<RaceResult> results) {
        DriverComparisonDto.ComparisonStats stats = new DriverComparisonDto.ComparisonStats();
        stats.setPoints(driver.getPoints() != null ? driver.getPoints() : 0.0);
        stats.setWins(driver.getWins());
        stats.setPodiums(driver.getPodiums());
        
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

    public MomentumDto getDriverMomentum(Long driverId, Integer window, Integer season) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
                
        List<RaceResult> allResults = raceResultRepository.findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(driverId, season, SessionType.RACE);
        // Ensure sorted by round
        allResults.sort(Comparator.comparing(r -> r.getRace().getRound()));
        
        MomentumDto dto = new MomentumDto();
        dto.setDriver(driverService.toDto(driver));
        
        List<MomentumDto.RaceMomentum> recentRaces = new ArrayList<>();
        int startIndex = Math.max(0, allResults.size() - window);
        
        for (int i = startIndex; i < allResults.size(); i++) {
            RaceResult r = allResults.get(i);
            MomentumDto.RaceMomentum rm = new MomentumDto.RaceMomentum();
            rm.setRaceName(r.getRace().getName());
            rm.setRound(r.getRace().getRound());
            rm.setGridPosition(r.getGridPosition() != null ? r.getGridPosition() : 0);
            rm.setFinishPosition(r.getPosition() != null ? r.getPosition() : 20); // Fallback for DNF
            rm.setPositionDelta(rm.getGridPosition() > 0 && rm.getFinishPosition() > 0 ? rm.getGridPosition() - rm.getFinishPosition() : 0);
            rm.setPoints(r.getPoints() != null ? r.getPoints() : 0.0);
            
            // Rolling avg logic (simplified to window)
            double sumFinish = 0;
            double sumPoints = 0;
            int count = 0;
            int rollStart = Math.max(0, i - window + 1);
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
            if (score > 70) dto.setFormTrend("HOT");
            else if (score < 30) dto.setFormTrend("COLD");
            else dto.setFormTrend("NEUTRAL");
        }
        
        return dto;
    }

    public ConsistencyDto getConsistencyAnalytics(Integer season) {
        List<Race> races = raceRepository.findBySeasonOrderByRoundAsc(season);
        List<String> raceNames = races.stream().map(Race::getName).collect(Collectors.toList());
        
        List<Driver> allDrivers = driverRepository.findAllByOrderByChampionshipPositionAsc();
        List<RaceResult> allResults = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season, SessionType.RACE);
        
        // Group by driver
        Map<Long, List<RaceResult>> resultsByDriver = allResults.stream()
                .collect(Collectors.groupingBy(r -> r.getDriver().getId()));
                
        List<ConsistencyDto.DriverConsistency> driverConsistencies = new ArrayList<>();
        
        for (Driver d : allDrivers) {
            List<RaceResult> dResults = resultsByDriver.getOrDefault(d.getId(), Collections.emptyList());
            if (dResults.isEmpty()) continue;
            
            ConsistencyDto.DriverConsistency dc = new ConsistencyDto.DriverConsistency();
            dc.setDriver(driverService.toDto(d));
            
            int pointFinishes = 0;
            double sumPos = 0;
            int count = 0;
            Map<String, String> raceResMap = new LinkedHashMap<>();
            
            for (RaceResult r : dResults) {
                if (r.getPoints() > 0) pointFinishes++;
                if (r.getPosition() != null && r.getPosition() > 0) {
                    sumPos += r.getPosition();
                    count++;
                }
                String resStr = (r.getPosition() != null && r.getPosition() > 0) ? String.valueOf(r.getPosition()) : "DNF";
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
}
