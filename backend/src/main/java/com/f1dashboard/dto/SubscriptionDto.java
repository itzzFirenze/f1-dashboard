package com.f1dashboard.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for creating or updating a notification subscription.
 */
public record SubscriptionDto(
      @NotBlank @Email
      String email,

      Long raceId,

      boolean notifyRaceWeek,
      boolean notifyDayBefore,
      boolean notifyBeforeSession,

      Boolean allUpcoming
) {
   public boolean isAllUpcoming() {
      return Boolean.TRUE.equals(allUpcoming);
   }
}
