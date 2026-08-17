package com.f1dashboard.repository;

import com.f1dashboard.entity.Race;
import com.f1dashboard.enums.RaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceRepository extends JpaRepository<Race, Long> {

   List<Race> findBySeasonOrderByRoundAsc(Integer season);

   List<Race> findBySeasonAndStatusOrderByRoundAsc(Integer season, RaceStatus status);

   @Query("SELECT r FROM Race r WHERE r.raceDate >= CURRENT_DATE ORDER BY r.raceDate ASC LIMIT 1")
   Race findNextUpcomingRace();

   long countBySeasonAndStatus(Integer season, RaceStatus status);

   @Query("SELECT r FROM Race r JOIN r.circuit c WHERE r.season = :season AND (" +
         "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(c.country) LIKE LOWER(CONCAT('%', :query, '%')))")
   List<Race> searchRaces(@Param("season") Integer season, @Param("query") String query);

   java.util.Optional<Race> findBySeasonAndRound(Integer season, Integer round);
}
