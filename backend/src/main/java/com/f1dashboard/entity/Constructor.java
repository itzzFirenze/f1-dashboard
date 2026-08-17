package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "constructors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Constructor {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false, unique = true)
   private String constructorRef;

   @Column(nullable = false)
   private String name;

   @Column(nullable = false)
   private String nationality;

   private String logoUrl;

   @Column(length = 7)
   private String color;

   @Column(nullable = false)
   private Double points;

   @Column(nullable = false)
   private Integer wins;

   private Integer championshipPosition;

   @OneToMany(mappedBy = "constructor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
   @Builder.Default
   private List<Driver> drivers = new ArrayList<>();
}