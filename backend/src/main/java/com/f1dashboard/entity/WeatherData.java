package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "weather_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherData {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @OneToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "race_id", nullable = false, unique = true)
   private Race race;

   private Double temperature;

   private Integer rainProbability;

   private Double windSpeed;

   private String weatherCondition;

   private Integer humidity;

   private LocalDateTime lastUpdated;
}