package com.f1dashboard.repository;

import com.f1dashboard.entity.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    /** Find results for a race, ordered by position */
    List<RaceResult> findByRaceIdOrderByPositionAsc(Long raceId);

    /** Find all results for a specific driver */
    List<RaceResult> findByDriverIdOrderByRaceRaceDateDesc(Long driverId);
    /** Delete all results for a specific race */
    void deleteByRaceId(Long raceId);
}
