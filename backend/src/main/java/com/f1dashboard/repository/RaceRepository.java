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

    /** Find all races in a season ordered by round */
    List<Race> findBySeasonOrderByRoundAsc(Integer season);

    /** Find races by status */
    List<Race> findBySeasonAndStatusOrderByRoundAsc(Integer season, RaceStatus status);

    /** Find the next upcoming race */
    @Query("SELECT r FROM Race r WHERE r.status = 'UPCOMING' ORDER BY r.raceDate ASC LIMIT 1")
    Race findNextUpcomingRace();

    /** Count completed races in a season */
    long countBySeasonAndStatus(Integer season, RaceStatus status);

    /** Search races by name or country */
    @Query("SELECT r FROM Race r JOIN r.circuit c WHERE r.season = :season AND (" +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.country) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Race> searchRaces(@Param("season") Integer season, @Param("query") String query);
    /** Find a specific race by season and round */
    java.util.Optional<Race> findBySeasonAndRound(Integer season, Integer round);
}
