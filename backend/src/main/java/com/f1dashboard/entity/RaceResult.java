package com.f1dashboard.entity;

import com.f1dashboard.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "race_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceResult {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "race_id", nullable = false)
   private Race race;

   @ManyToOne(fetch = FetchType.EAGER)
   @JoinColumn(name = "driver_id", nullable = false)
   private Driver driver;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "constructor_id")
   private Constructor constructor;

   @Enumerated(EnumType.STRING)

   @Column(nullable = false)
   @Builder.Default
   private SessionType sessionType = SessionType.RACE;
   private Integer position;

   @Column(nullable = false)
   private Double points;
   private String status;

   @Column(nullable = false)
   private Boolean fastestLap;
   private Integer gridPosition;

   @Column(name = "q1_time")
   private String q1Time;

   @Column(name = "q2_time")
   private String q2Time;

   @Column(name = "q3_time")
   private String q3Time;
}