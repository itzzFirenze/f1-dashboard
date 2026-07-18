package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Cached weather data for a race weekend.
 * Updated periodically from external weather APIs.
 */
@Entity
@Table(name = "weather_data")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WeatherData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false, unique = true)
    private Race race;

    /** Temperature in Celsius */
    private Double temperature;

    /** Percentage chance of rain (0-100) */
    private Integer rainProbability;

    /** Wind speed in km/h */
    private Double windSpeed;

    /** Weather condition description, e.g. "Partly Cloudy" */
    private String weatherCondition;

    /** Humidity percentage */
    private Integer humidity;

    /** When this weather data was last refreshed */
    private LocalDateTime lastUpdated;
}
