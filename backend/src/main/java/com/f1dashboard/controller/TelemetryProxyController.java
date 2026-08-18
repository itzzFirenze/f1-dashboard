package com.f1dashboard.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
public class TelemetryProxyController {

   private final RestTemplate restTemplate;
   private static final String OPENF1_BASE_URL = "https://api.openf1.org/v1";

   private static final Set<String> ALLOWED_ENDPOINTS = Set.of(
         "sessions", "drivers", "laps", "stints", "pit", "race_control",
         "team_radio", "location", "car_data", "weather", "intervals", "position"
   );

   private static final int MAX_CACHE_SIZE = 300;

   // Thread-safe bounded LRU cache
   private final Map<URI, Object[]> cache = Collections.synchronizedMap(
         new LinkedHashMap<URI, Object[]>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<URI, Object[]> eldest) {
               return size() > MAX_CACHE_SIZE;
            }
         }
   );

   @GetMapping("/{endpoint}")
   public ResponseEntity<Object[]> proxyRequest(
         @PathVariable String endpoint,
         @RequestParam Map<String, String> allParams,
         HttpServletRequest request) {

      // Validate endpoint to prevent path traversal or SSRF to arbitrary endpoints
      if (endpoint == null || !ALLOWED_ENDPOINTS.contains(endpoint.toLowerCase())) {
         return ResponseEntity.status(HttpStatus.BAD_REQUEST)
               .body(new Object[] { Map.of("error", "Invalid or disallowed telemetry endpoint") });
      }

      String queryString = request.getQueryString();
      String urlString = OPENF1_BASE_URL + "/" + endpoint;
      if (queryString != null) {
         urlString += "?" + queryString;
      }

      URI targetUri = URI.create(urlString);

      Object[] cached = cache.get(targetUri);
      if (cached != null) {
         return ResponseEntity.ok(cached);
      }

      int maxRetries = 3;
      for (int i = 0; i < maxRetries; i++) {
         try {
            Object[] response = restTemplate.getForObject(targetUri, Object[].class);
            if (response != null) {
               cache.put(targetUri, response);
            }
            return ResponseEntity.ok(response);
         } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            return ResponseEntity.ok(new Object[0]);
         } catch (org.springframework.web.client.HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429 && i < maxRetries - 1) {
               try {
                  Thread.sleep(1000 * (i + 1)); // Exponential backoff: 1s, 2s...
               } catch (InterruptedException ie) {
                  Thread.currentThread().interrupt();
               }
               continue; // Retry
            }
            return ResponseEntity.status(e.getStatusCode())
                  .body(new Object[] { Map.of("error", e.getResponseBodyAsString()) });
         } catch (Exception e) {
            return ResponseEntity.internalServerError()
                  .body(new Object[] { Map.of("error", e.getMessage()) });
         }
      }

      return ResponseEntity.status(429).body(new Object[] { Map.of("error", "Rate limit exceeded after retries") });
   }
}