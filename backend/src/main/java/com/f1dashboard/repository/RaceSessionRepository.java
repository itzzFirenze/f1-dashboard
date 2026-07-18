package com.f1dashboard.repository;

import com.f1dashboard.entity.RaceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceSessionRepository extends JpaRepository<RaceSession, Long> {

    /** Find all sessions for a specific race, ordered by date and time */
    List<RaceSession> findByRaceIdOrderBySessionDateAscSessionTimeAsc(Long raceId);

    void deleteByRaceId(Long raceId);
}
