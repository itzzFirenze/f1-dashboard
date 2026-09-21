package com.f1dashboard.repository;

import com.f1dashboard.entity.RaceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface RaceSessionRepository extends JpaRepository<RaceSession, Long> {

   List<RaceSession> findByRaceIdOrderBySessionDateAscSessionTimeAsc(Long raceId);

   void deleteByRaceId(Long raceId);

   /**
    * Finds all sessions whose (date, time) pair falls within the given time window.
    * Used by the notification scheduler to avoid a per-race N+1 query loop.
    *
    * @param date        the calendar date to match (handles midnight cross-over: same date only)
    * @param windowStart lower bound of the time window (inclusive)
    * @param windowEnd   upper bound of the time window (exclusive)
    */
   @Query("SELECT s FROM RaceSession s WHERE s.sessionDate = :date " +
         "AND s.sessionTime >= :windowStart AND s.sessionTime < :windowEnd")
   List<RaceSession> findUpcomingSessions(@Param("date") LocalDate date,
                                          @Param("windowStart") LocalTime windowStart,
                                          @Param("windowEnd") LocalTime windowEnd);
}