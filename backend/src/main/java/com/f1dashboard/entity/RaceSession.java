package com.f1dashboard.entity;

import com.f1dashboard.enums.SessionType;
import com.f1dashboard.enums.RaceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Represents a single session within a race weekend
 * (FP1, FP2, FP3, Sprint Qualifying, Sprint, Qualifying, Race).
 */
@Entity
@Table(name = "race_sessions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RaceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType sessionType;

    @Column(nullable = false)
    private LocalDate sessionDate;

    private LocalTime sessionTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RaceStatus status;
}
