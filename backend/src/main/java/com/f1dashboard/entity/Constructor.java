package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an F1 constructor (team).
 * Stores team details, standings info, and links to drivers.
 */
@Entity
@Table(name = "constructors")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Constructor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique reference slug, e.g. "red_bull" */
    @Column(nullable = false, unique = true)
    private String constructorRef;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String nationality;

    /** URL to the team logo image */
    private String logoUrl;

    /** Team colour in hex, e.g. "#E8002D" */
    @Column(length = 7)
    private String color;

    /** Current championship points */
    @Column(nullable = false)
    private Double points;

    /** Number of race wins this season */
    @Column(nullable = false)
    private Integer wins;

    /** Current championship position */
    private Integer championshipPosition;

    /** Drivers currently racing for this constructor */
    @OneToMany(mappedBy = "constructor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Driver> drivers = new ArrayList<>();
}
