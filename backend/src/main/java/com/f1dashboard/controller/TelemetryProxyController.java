package com.f1dashboard.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
public class TelemetryProxyController {

   private final RestTemplate restTemplate;
   private static final String OPENF1_BASE_URL = "https://api.openf1.org/v1";

   private final java.util.concurrent.ConcurrentHashMap<URI, Object[]> cache = new java.util.concurrent.ConcurrentHashMap<>();

   @GetMapping("/{endpoint}")
   public ResponseEntity<Object[]> proxyRequest(
         @PathVariable String endpoint,
         @RequestParam Map<String, String> allParams,
         HttpServletRequest request) {

      String queryString = request.getQueryString();
      String urlString = OPENF1_BASE_URL + "/" + endpoint;
      if (queryString != null) {
         urlString += "?" + queryString;
      }

      URI targetUri = URI.create(urlString);

      if (cache.containsKey(targetUri)) {
         return ResponseEntity.ok(cache.get(targetUri));
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