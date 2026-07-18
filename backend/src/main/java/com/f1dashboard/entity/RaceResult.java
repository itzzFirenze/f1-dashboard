package com.f1dashboard.entity;

import com.f1dashboard.enums.SessionType;
import jakarta.persistence.*;
import lombok.*;

/**
 * Stores race result for a driver in a specific Grand Prix.
 */
@Entity
@Table(name = "race_results")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionType sessionType = SessionType.RACE;

    /** Finishing position (1-20, or null if DNF) */
    private Integer position;

    /** Points scored in this race */
    @Column(nullable = false)
    private Double points;

    /** Result status, e.g. "Finished", "DNF", "+1 Lap" */
    private String status;

    /** Whether this driver set the fastest lap */
    @Column(nullable = false)
    private Boolean fastestLap;

    /** Grid starting position */
    private Integer gridPosition;
}
