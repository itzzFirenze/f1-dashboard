package com.f1dashboard.entity;

import com.f1dashboard.enums.RaceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "races", indexes = {
      @Index(name = "idx_race_season", columnList = "season"),
      @Index(name = "idx_race_date", columnList = "raceDate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Race {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false)
   private Integer season;

   @Column(nullable = false)
   private Integer round;

   @Column(nullable = false)
   private String name;

   @ManyToOne(fetch = FetchType.EAGER)
   @JoinColumn(name = "circuit_id", nullable = false)
   private Circuit circuit;

   @Column(nullable = false)
   private LocalDate raceDate;

   private LocalTime raceTime;

   @Enumerated(EnumType.STRING)
   @Column(nullable = false)
   private RaceStatus status;

   @Column(nullable = false)
   private Boolean sprintWeekend;

   @Column(nullable = true)
   private String alphaRoundId;

   @OneToMany(mappedBy = "race", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
   @Builder.Default
   private List<RaceSession> sessions = new ArrayList<>();

   @OneToMany(mappedBy = "race", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
   @Builder.Default
   private List<RaceResult> results = new ArrayList<>();
}