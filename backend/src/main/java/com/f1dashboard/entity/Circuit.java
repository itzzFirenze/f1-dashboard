package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents an F1 circuit / track.
 * Stores track characteristics and location data.
 */
@Entity
@Table(name = "circuits")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Circuit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique reference slug, e.g. "albert_park" */
    @Column(nullable = false, unique = true)
    private String circuitRef;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String country;

    /** City or region */
    @Column(nullable = false)
    private String location;

    /** Track length in kilometres */
    private Double lengthKm;

    /** Number of corners / turns */
    private Integer corners;

    /** Lap record time string, e.g. "1:20.260" */
    private String lapRecord;

    /** Driver who holds the lap record */
    private String lapRecordHolder;

    /** URL to circuit layout image */
    private String imageUrl;

    private Double latitude;
    private Double longitude;
}
