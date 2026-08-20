package com.f1dashboard.service;

import com.f1dashboard.dto.RecordsDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Constructor;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.repository.ConstructorRepository;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordsService {

   private final DriverRepository driverRepository;
   private final ConstructorRepository constructorRepository;
   private final RaceResultRepository raceResultRepository;

   public RecordsDto getHistoricalRecords() {
      return getHistoricalRecords(null);
   }

   @Cacheable(cacheNames = CacheConfig.RECORDS, key = "'historical:' + (#season == null ? 'all' : #season)")
   public RecordsDto getHistoricalRecords(Integer season) {
      RecordsDto dto = new RecordsDto();

      List<Driver> drivers = driverRepository.findAll();
      List<Constructor> constructors = constructorRepository.findAll();
      List<RaceResult> results = (season != null
            ? raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season, SessionType.RACE)
            : raceResultRepository.findAll().stream()
                  .filter(r -> r.getSessionType() == SessionType.RACE)
                  .toList());

      // 1. Most Wins (Driver)
      dto.setMostWinsDriver(drivers.stream()
            .map(d -> {
               List<RaceResult> dResults = results.stream()
                     .filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).toList();
               long wins = dResults.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();
               return createDriverRecord(d, wins, wins + " Wins", dResults, season);
            })
            .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
            .limit(10).toList());

      // 2. Most Podiums (Driver)
      dto.setMostPodiumsDriver(drivers.stream()
            .map(d -> {
               List<RaceResult> dResults = results.stream()
                     .filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).toList();
               long podiums = dResults.stream().filter(r -> r.getPosition() != null && r.getPosition() <= 3).count();
               return createDriverRecord(d, podiums, podiums + " Podiums", dResults, season);
            })
            .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
            .limit(10).toList());

      // 3. Most Points (Driver)
      dto.setMostPointsDriver(drivers.stream()
            .map(d -> {
               List<RaceResult> dResults = results.stream()
                     .filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).toList();
               double points = dResults.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0).sum();
               return createDriverRecord(d, points, String.format("%.0f Pts", points), dResults, season);
            })
            .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
            .limit(10).toList());

      // 4. Highest Win Rate (Driver)
      dto.setHighestWinRateDriver(drivers.stream()
            .map(d -> {
               List<RaceResult> dResults = results.stream()
                     .filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).toList();
               long races = dResults.size();
               long wins = dResults.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();
               double rate = races > 0 ? ((double) wins / races) * 100 : 0;
               return createDriverRecord(d, rate, String.format("%.1f%% (%d/%d)", rate, wins, races), dResults, season);
            })
            .filter(r -> r.getValue() > 0) // only drivers with at least 1 win
            .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
            .limit(10).toList());

      // 5. Most Wins (Constructor)
      dto.setMostWinsConstructor(constructors.stream()
            .map(c -> {
               long wins = results.stream().filter(r -> r.getConstructor() != null
                     && r.getConstructor().getId().equals(c.getId()) && r.getPosition() != null && r.getPosition() == 1)
                     .count();
               return createConstructorRecord(c, wins, wins + " Wins");
            })
            .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
            .limit(10).toList());

      // 6. Most Podiums (Constructor)
      dto.setMostPodiumsConstructor(constructors.stream()
            .map(c -> {
               long podiums = results.stream().filter(r -> r.getConstructor() != null
                     && r.getConstructor().getId().equals(c.getId()) && r.getPosition() != null && r.getPosition() <= 3)
                     .count();
               return createConstructorRecord(c, podiums, podiums + " Podiums");
            })
            .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
            .limit(10).toList());

      // 7. Most Points (Constructor)
      dto.setMostPointsConstructor(constructors.stream()
            .map(c -> {
               double points = results.stream()
                     .filter(r -> r.getConstructor() != null && r.getConstructor().getId().equals(c.getId()))
                     .mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0).sum();
               return createConstructorRecord(c, points, String.format("%.0f Pts", points));
            })
            .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
            .limit(10).toList());

      return dto;
   }

   private RecordsDto.DriverRecord createDriverRecord(Driver d, double value, String displayValue,
         List<RaceResult> driverResults, Integer season) {
      RecordsDto.DriverRecord dr = new RecordsDto.DriverRecord();
      dr.setDriverCode(d.getCode());
      dr.setDriverName(d.getFirstName() + " " + d.getLastName());

      Constructor teamForDisplay;
      if (season == null) {
         // All-time: show current/live team, as before
         teamForDisplay = d.getConstructor();
      } else {
         // Season-scoped: derive from that season's actual results
         teamForDisplay = driverResults.stream()
               .filter(r -> r.getConstructor() != null)
               .reduce((first, second) -> second) // most recent result that season
               .map(RaceResult::getConstructor)
               .orElse(d.getConstructor()); // fallback if no results had a constructor set
      }

      dr.setConstructorName(teamForDisplay != null ? teamForDisplay.getName() : "Unknown");
      dr.setConstructorColor(teamForDisplay != null ? teamForDisplay.getColor() : "#E10600");
      dr.setValue(value);
      dr.setDisplayValue(displayValue);
      return dr;
   }

   private RecordsDto.ConstructorRecord createConstructorRecord(Constructor c, double value, String displayValue) {
      RecordsDto.ConstructorRecord cr = new RecordsDto.ConstructorRecord();
      cr.setConstructorName(c.getName());
      cr.setConstructorColor(c.getColor());
      cr.setValue(value);
      cr.setDisplayValue(displayValue);
      return cr;
   }
}
