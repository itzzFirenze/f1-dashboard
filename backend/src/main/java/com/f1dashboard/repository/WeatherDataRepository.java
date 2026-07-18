package com.f1dashboard.repository;

import com.f1dashboard.entity.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {

    /** Find weather data for a specific race */
    Optional<WeatherData> findByRaceId(Long raceId);
}
