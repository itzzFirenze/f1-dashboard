package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "drivers", indexes = {
      @Index(name = "idx_driver_points", columnList = "points DESC"),
      @Index(name = "idx_driver_name", columnList = "lastName, firstName")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false, unique = true)
   private String driverRef;

   @Column(nullable = false, length = 3)
   private String code;

   @Column(nullable = false)
   private String firstName;

   @Column(nullable = false)
   private String lastName;

   private Integer number;

   private LocalDate dateOfBirth;

   @Column(nullable = false)
   private String nationality;

   private String imageUrl;

   @Column(nullable = false)
   private Double points;

   @Column(nullable = false)
   private Integer wins;

   @Column(nullable = false)
   private Integer podiums;

   private Integer championshipPosition;

   @ManyToOne(fetch = FetchType.EAGER)
   @JoinColumn(name = "constructor_id")
   private Constructor constructor;
}