package com.f1dashboard.repository;

import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

   @EntityGraph(attributePaths = { "race", "race.circuit", "driver", "driver.constructor", "constructor" })
   List<RaceResult> findByRaceIdAndSessionTypeOrderByPositionAsc(Long raceId, SessionType sessionType);

   @EntityGraph(attributePaths = { "race", "race.circuit", "driver", "driver.constructor", "constructor" })
   List<RaceResult> findByDriverIdOrderByRaceRaceDateDesc(Long driverId);

   int countByDriverIdAndPositionLessThanEqualAndSessionType(Long driverId, Integer position, SessionType sessionType);

   void deleteByRaceId(Long raceId);

   void deleteByRaceIdAndSessionType(Long raceId, SessionType sessionType);

   @EntityGraph(attributePaths = { "race", "race.circuit", "driver", "driver.constructor", "constructor" })
   List<RaceResult> findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(Integer season, SessionType sessionType);

   @EntityGraph(attributePaths = { "race", "race.circuit", "driver", "driver.constructor", "constructor" })
   List<RaceResult> findByDriverIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(Long driverId, Integer season,
         SessionType sessionType);

   @EntityGraph(attributePaths = { "race", "race.circuit", "driver", "driver.constructor", "constructor" })
   List<RaceResult> findByConstructorIdAndRaceSeasonAndSessionTypeOrderByRaceRoundAsc(Long constructorId,
         Integer season, SessionType sessionType);
}
