package com.f1dashboard.repository;

import com.f1dashboard.entity.NotificationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationSubscriptionRepository extends JpaRepository<NotificationSubscription, Long> {

   Optional<NotificationSubscription> findByEmailAndRaceId(String email, Long raceId);

   Optional<NotificationSubscription> findByUnsubscribeToken(String token);

   List<NotificationSubscription> findAllByRaceId(Long raceId);

   List<NotificationSubscription> findAllByEmail(String email);

   long countByEmail(String email);

   void deleteAllByEmail(String email);
}
