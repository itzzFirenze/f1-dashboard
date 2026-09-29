package com.f1dashboard.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class KeepAliveService {

   @Value("${app.self-ping-url:}")
   private String selfPingUrl;

   private final RestTemplate restTemplate;

   public KeepAliveService(RestTemplate restTemplate) {
      this.restTemplate = restTemplate;
   }

   @EventListener(ApplicationReadyEvent.class)
   public void onStartup() {
      if (selfPingUrl == null || selfPingUrl.isBlank()) {
         log.info("[KeepAlive] Self-ping disabled (APP_SELF_PING_URL not set). " +
               "Set APP_SELF_PING_URL to this service's public URL to prevent Render spin-down.");
      } else {
         log.info("[KeepAlive] Self-ping enabled → pinging {} every 8 minutes.", selfPingUrl);
         ping();
      }
   }

   @Scheduled(fixedDelayString = "${app.self-ping-interval-ms:480000}")
   public void scheduledPing() {
      if (selfPingUrl != null && !selfPingUrl.isBlank()) {
         ping();
      }
   }

   private void ping() {
      try {
         String url = selfPingUrl.endsWith("/") ? selfPingUrl + "api/health" : selfPingUrl + "/api/health";
         restTemplate.getForObject(url, String.class);
         log.debug("[KeepAlive] Ping OK → {}", url);
      } catch (Exception e) {
         log.warn("[KeepAlive] Ping failed: {}", e.getMessage());
      }
   }
}
