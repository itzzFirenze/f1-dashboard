package com.f1dashboard.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

   public static final String DASHBOARD = "dashboard";
   public static final String DRIVERS = "drivers";
   public static final String CONSTRUCTORS = "constructors";
   public static final String RACES = "races";
   public static final String CIRCUITS = "circuits";
   public static final String WEATHER = "weather";
   public static final String ANALYTICS = "analytics";
   public static final String RECORDS = "records";

   @Bean
   public CacheManager cacheManager() {
      CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            DASHBOARD,
            DRIVERS,
            CONSTRUCTORS,
            RACES,
            CIRCUITS,
            WEATHER,
            ANALYTICS,
            RECORDS);
      cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(10))
            .maximumSize(1_000));
      return cacheManager;
   }
}
