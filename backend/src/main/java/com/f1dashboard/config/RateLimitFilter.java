package com.f1dashboard.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple per-IP token-bucket rate limiter — no external dependencies.
 *
 * Bucket definitions (applied in order of first match):
 *
 * | Route pattern                        | Tokens | Refill window |
 * |--------------------------------------|--------|---------------|
 * | POST /api/notifications/subscribe    |      5 | 10 minutes    |
 * | POST /api/sync                       |      3 | 60 minutes    |
 * | POST /api/sync/backfill/**           |      2 | 60 minutes    |
 * | GET  /api/telemetry/**               |    120 | 60 seconds    |
 * | *    /api/**                         |    300 | 60 seconds    |
 */
@Slf4j
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

   // Each entry: key → [tokensRemaining, windowStartEpochMs]
   private final ConcurrentHashMap<String, long[]> buckets = new ConcurrentHashMap<>();

   /** Bucket config: tokens allowed per windowMs interval */
   private record BucketConfig(long maxTokens, long windowMs) {}

   private static final BucketConfig SUBSCRIBE_LIMIT  = new BucketConfig(5,   10 * 60_000L);
   private static final BucketConfig SYNC_LIMIT        = new BucketConfig(3,   60 * 60_000L);
   private static final BucketConfig BACKFILL_LIMIT    = new BucketConfig(2,   60 * 60_000L);
   private static final BucketConfig TELEMETRY_LIMIT   = new BucketConfig(120, 60_000L);
   private static final BucketConfig DEFAULT_API_LIMIT = new BucketConfig(300, 60_000L);

   @Override
   protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain chain) throws ServletException, IOException {

      String path   = request.getRequestURI();
      String method = request.getMethod();

      // Only rate-limit API paths and never block CORS preflight OPTIONS requests
      if (!path.startsWith("/api/") || "OPTIONS".equalsIgnoreCase(method)) {
         chain.doFilter(request, response);
         return;
      }

      BucketConfig config = resolveConfig(method, path);
      String       ip     = resolveClientIp(request);
      String       key    = ip + "|" + bucketKey(method, path);

      if (!tryConsume(key, config)) {
         log.warn("[RateLimit] Limit exceeded: ip={} path={} method={}", ip, path, method);
         response.setStatus(429);
         response.setContentType(MediaType.APPLICATION_JSON_VALUE);
         response.getWriter().write("{\"status\":\"error\",\"message\":\"Too many requests. Please slow down.\"}");
         return;
      }

      chain.doFilter(request, response);
   }

   // ── Helpers ────────────────────────────────────────────────────────────────

   private BucketConfig resolveConfig(String method, String path) {
      if ("POST".equalsIgnoreCase(method) && path.equals("/api/notifications/subscribe")) {
         return SUBSCRIBE_LIMIT;
      }
      if ("POST".equalsIgnoreCase(method) && path.equals("/api/sync")) {
         return SYNC_LIMIT;
      }
      if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/sync/backfill")) {
         return BACKFILL_LIMIT;
      }
      if (path.startsWith("/api/telemetry/")) {
         return TELEMETRY_LIMIT;
      }
      return DEFAULT_API_LIMIT;
   }

   /** Collapsed key for grouping similar paths (e.g., all /api/telemetry/* share one bucket per IP). */
   private String bucketKey(String method, String path) {
      if (path.equals("/api/notifications/subscribe"))  return "notify-subscribe";
      if (path.equals("/api/sync"))                     return "sync";
      if (path.startsWith("/api/sync/backfill"))        return "sync-backfill";
      if (path.startsWith("/api/telemetry/"))           return "telemetry";
      return "api-default";
   }

   /**
    * Token-bucket consume.
    * Returns true if the request is within the allowed rate, false if it should be blocked.
    */
   private boolean tryConsume(String key, BucketConfig config) {
      long nowMs = Instant.now().toEpochMilli();

      if (buckets.size() > 2000) {
         buckets.entrySet().removeIf(e -> nowMs - e.getValue()[1] > config.windowMs() * 2);
      }

      final boolean[] allowed = new boolean[1];
      buckets.compute(key, (k, existing) -> {
         if (existing == null || nowMs - existing[1] >= config.windowMs()) {
            allowed[0] = true;
            return new long[]{ config.maxTokens() - 1, nowMs };
         }
         if (existing[0] > 0) {
            allowed[0] = true;
            existing[0]--;
            return existing;
         }
         allowed[0] = false;
         return existing;
      });

      return allowed[0];
   }

   /**
    * Resolve the real client IP, respecting the X-Forwarded-For header set
    * by Render's / nginx's reverse proxy.
    */
   private String resolveClientIp(HttpServletRequest request) {
      String xff = request.getHeader("X-Forwarded-For");
      if (xff != null && !xff.isBlank()) {
         // X-Forwarded-For can be a comma-separated list; first entry is the original client
         return xff.split(",")[0].trim();
      }
      String xReal = request.getHeader("X-Real-IP");
      if (xReal != null && !xReal.isBlank()) {
         return xReal.trim();
      }
      return request.getRemoteAddr();
   }
}
