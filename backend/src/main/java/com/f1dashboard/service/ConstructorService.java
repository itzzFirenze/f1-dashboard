package com.f1dashboard.service;

import com.f1dashboard.dto.ConstructorDto;
import com.f1dashboard.dto.ConstructorDetailDto;
import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.config.CacheConfig;
import com.f1dashboard.entity.Constructor;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.ConstructorRepository;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service for constructor-related business logic.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConstructorService {

   private final ConstructorRepository constructorRepository;
   private final DriverRepository driverRepository;
   private final RaceResultRepository raceResultRepository;

   /** Get all constructors ordered by championship position */
   public List<ConstructorDto> getAllConstructors() {
      return getAllConstructors(null);
   }

   /** Get all constructors for a specific season */
   @Cacheable(cacheNames = CacheConfig.CONSTRUCTORS, key = "'all:' + (#season == null ? 'current' : #season)")
   public List<ConstructorDto> getAllConstructors(Integer season) {
      if (season == null) {
         return constructorRepository.findAllByOrderByChampionshipPositionAsc()
               .stream()
               .map(this::toDto)
               .toList();
      }

      List<Constructor> allConstructors = constructorRepository.findAll();
      List<RaceResult> results = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.RACE);
      List<RaceResult> sprintResults = raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season,
            SessionType.SPRINT);

      List<ConstructorDto> dtoList = new ArrayList<>();
      for (Constructor c : allConstructors) {
         List<RaceResult> cResults = results.stream()
               .filter(r -> r.getConstructor() != null
                     && r.getConstructor().getId().equals(c.getId()))
               .toList();
         if (cResults.isEmpty()) {
            continue;
         }
         List<RaceResult> cSprintResults = sprintResults.stream()
               .filter(r -> r.getConstructor() != null
                     && r.getConstructor().getId().equals(c.getId()))
               .toList();

         double racePoints = cResults.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0).sum();
         double sprintPoints = cSprintResults.stream().mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0.0)
               .sum();
         double points = racePoints + sprintPoints;

         int wins = (int) cResults.stream().filter(r -> r.getPosition() != null && r.getPosition() == 1).count();

         ConstructorDto dto = new ConstructorDto(
               c.getId(), c.getName(), c.getNationality(),
               c.getLogoUrl(), c.getColor(), points,
               wins, 0);
         dtoList.add(dto);
      }

      dtoList.sort(
            Comparator.comparingDouble(ConstructorDto::points).reversed()
                  .thenComparing(ConstructorDto::wins, Comparator.reverseOrder()));

      List<ConstructorDto> rankedList = new ArrayList<>();
      for (int i = 0; i < dtoList.size(); i++) {
         ConstructorDto c = dtoList.get(i);
         rankedList.add(new ConstructorDto(
               c.id(), c.name(), c.nationality(), c.logoUrl(),
               c.color(), c.points(), c.wins(), i + 1));
      }

      if (rankedList.isEmpty()) {
         return constructorRepository.findAllByOrderByChampionshipPositionAsc()
               .stream()
               .map(this::toDto)
               .toList();
      }

      return rankedList;
   }

   /** Get detailed constructor with driver lineup */
   @Cacheable(cacheNames = CacheConfig.CONSTRUCTORS, key = "'detail:' + #id")
   public ConstructorDetailDto getConstructorById(Long id) {
      Constructor c = constructorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Constructor", "id", id));

      List<DriverDto> drivers = driverRepository
            .findByConstructorIdOrderByChampionshipPositionAsc(id)
            .stream()
            .map(d -> new DriverDto(
                  d.getId(), d.getCode(), d.getFirstName(), d.getLastName(),
                  d.getNumber(), d.getNationality(), d.getImageUrl(),
                  d.getPoints(), d.getWins(), d.getPodiums(),
                  d.getChampionshipPosition(),
                  c.getName(), c.getColor()))
            .toList();

      return new ConstructorDetailDto(
            c.getId(), c.getName(), c.getNationality(),
            c.getLogoUrl(), c.getColor(), c.getPoints(),
            c.getWins(), c.getChampionshipPosition(), drivers);
   }

   /** Get the constructor championship leader */
   @Cacheable(cacheNames = CacheConfig.CONSTRUCTORS, key = "'leader'")
   public ConstructorDto getChampionshipLeader() {
      Constructor leader = constructorRepository.findByChampionshipPosition(1);
      return leader != null ? toDto(leader) : null;
   }

   public ConstructorDto toDto(Constructor c) {
      return new ConstructorDto(
            c.getId(), c.getName(), c.getNationality(),
            c.getLogoUrl(), c.getColor(), c.getPoints(),
            c.getWins(), c.getChampionshipPosition());
   }
}
