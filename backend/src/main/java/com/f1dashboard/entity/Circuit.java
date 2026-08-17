package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "circuits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Circuit {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false, unique = true)
   private String circuitRef;

   @Column(nullable = false)
   private String name;

   @Column(nullable = false)
   private String country;

   @Column(nullable = false)
   private String location;

   private Double lengthKm;

   private Integer corners;

   private String lapRecord;

   private String lapRecordHolder;

   private String imageUrl;

   private Double latitude;
   private Double longitude;
}