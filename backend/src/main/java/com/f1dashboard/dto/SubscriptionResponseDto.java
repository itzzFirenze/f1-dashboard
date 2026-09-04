package com.f1dashboard.dto;

/**
 * Response payload after subscribing or checking subscription status.
 */
public record SubscriptionResponseDto(
      Long id,
      String email,
      Long raceId,
      String raceName,
      boolean subscribed,
      boolean notifyRaceWeek,
      boolean notifyDayBefore,
      boolean notifyBeforeSession,
      String unsubscribeToken,
      String message,
      boolean allUpcoming,
      int totalSubscribedRaces
) {
   public SubscriptionResponseDto(
         Long id,
         String email,
         Long raceId,
         String raceName,
         boolean subscribed,
         boolean notifyRaceWeek,
         boolean notifyDayBefore,
         boolean notifyBeforeSession,
         String unsubscribeToken,
         String message
   ) {
      this(id, email, raceId, raceName, subscribed, notifyRaceWeek, notifyDayBefore,
           notifyBeforeSession, unsubscribeToken, message, false, subscribed ? 1 : 0);
   }
}
