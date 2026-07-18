package com.f1dashboard.repository;

import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    /** Find results for a race and session, ordered by position */
    List<RaceResult> findByRaceIdAndSessionTypeOrderByPositionAsc(Long raceId, SessionType sessionType);

    /** Find all results for a specific driver */
    List<RaceResult> findByDriverIdOrderByRaceRaceDateDesc(Long driverId);
    
    /** Count top N finishes for a driver in a specific session type */
    int countByDriverIdAndPositionLessThanEqualAndSessionType(Long driverId, Integer position, SessionType sessionType);
    
    /** Delete all results for a specific race */
    void deleteByRaceId(Long raceId);
}
