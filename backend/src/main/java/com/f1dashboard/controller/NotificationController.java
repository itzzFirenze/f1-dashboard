package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.SubscriptionDto;
import com.f1dashboard.dto.SubscriptionResponseDto;
import com.f1dashboard.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Race alert subscription endpoints")
public class NotificationController {

   private final NotificationService notificationService;

   @PostMapping("/subscribe")
   @Operation(summary = "Subscribe or update preferences for race alerts")
   public ResponseEntity<ApiResponse<SubscriptionResponseDto>> subscribe(
         @Valid @RequestBody SubscriptionDto dto) {
      try {
         SubscriptionResponseDto result = notificationService.subscribe(dto);
         return ResponseEntity.ok(ApiResponse.success(result));
      } catch (IllegalArgumentException e) {
         return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
      } catch (Exception e) {
         return ResponseEntity.status(500).body(ApiResponse.error("Subscription failed: " + e.getMessage()));
      }
   }

   @DeleteMapping("/unsubscribe/{token}")
   @Operation(summary = "Unsubscribe using the token from the confirmation email")
   public ResponseEntity<ApiResponse<String>> unsubscribe(
         @PathVariable String token,
         @RequestParam(defaultValue = "false") boolean all) {
      boolean removed = notificationService.unsubscribe(token, all);
      if (removed) {
         return ResponseEntity.ok(ApiResponse.success(all ? "Successfully unsubscribed from all races." : "Successfully unsubscribed."));
      }
      return ResponseEntity.status(404).body(ApiResponse.error("Token not found or already unsubscribed."));
   }

   @DeleteMapping("/unsubscribe-all")
   @Operation(summary = "Unsubscribe from all races by email")
   public ResponseEntity<ApiResponse<String>> unsubscribeAll(@RequestParam String email) {
      boolean removed = notificationService.unsubscribeAllByEmail(email);
      if (removed) {
         return ResponseEntity.ok(ApiResponse.success("Successfully unsubscribed from all races."));
      }
      return ResponseEntity.status(404).body(ApiResponse.error("No active subscriptions found for this email."));
   }

   @GetMapping("/status")
   @Operation(summary = "Check if an email is subscribed to a specific race")
   public ResponseEntity<ApiResponse<SubscriptionResponseDto>> getStatus(
         @RequestParam String email,
         @RequestParam Long raceId) {
      SubscriptionResponseDto result = notificationService.getStatus(email, raceId);
      return ResponseEntity.ok(ApiResponse.success(result));
   }
}
