package com.f1dashboard.service;

import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.dto.DriverDetailDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for driver-related business logic.
 * Maps entities to DTOs and handles search/pagination.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DriverService {

   private final DriverRepository driverRepository;
   private final RaceResultRepository raceResultRepository;

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
