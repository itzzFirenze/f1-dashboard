package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * Represents an F1 driver.
 * Stores personal info, current season statistics, and team affiliation.
 */
@Entity
@Table(name = "drivers", indexes = {
    @Index(name = "idx_driver_points", columnList = "points DESC"),
    @Index(name = "idx_driver_name", columnList = "lastName, firstName")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique reference slug, e.g. "max_verstappen" */
    @Column(nullable = false, unique = true)
    private String driverRef;

    /** Three-letter code, e.g. "VER" */
    @Column(nullable = false, length = 3)
    private String code;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    /** Permanent race number */
    private Integer number;

    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String nationality;

    /** URL to driver headshot image */
    private String imageUrl;

    /** Current championship points */
    @Column(nullable = false)
    private Double points;

    /** Season race wins */
    @Column(nullable = false)
    private Integer wins;

    /** Season podium finishes (top 3) */
    @Column(nullable = false)
    private Integer podiums;

    /** Current championship position */
    private Integer championshipPosition;

    /** The constructor this driver races for */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "constructor_id")
    private Constructor constructor;
}
