package com.f1dashboard.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
      name = "notification_subscriptions",
      uniqueConstraints = @UniqueConstraint(columnNames = {"email", "race_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSubscription {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false)
   private String email;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "race_id", nullable = false)
   private Race race;

   /** Fire one email when the race week begins (7 days before race day). */
   @Column(nullable = false)
   @Builder.Default
   private boolean notifyRaceWeek = true;

   /** Fire one email 24 hours before race day. */
   @Column(nullable = false)
   @Builder.Default
   private boolean notifyDayBefore = true;

   /** Fire an email ~5 minutes before each session start. */
   @Column(nullable = false)
   @Builder.Default
   private boolean notifyBeforeSession = true;

   /** Random token used in unsubscribe links — never changes after creation. */
   @Column(nullable = false, unique = true, updatable = false)
   @Builder.Default
   private String unsubscribeToken = UUID.randomUUID().toString();

   @Column(nullable = false, updatable = false)
   @Builder.Default
   private LocalDateTime createdAt = LocalDateTime.now();
}
