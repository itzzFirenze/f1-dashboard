package com.f1dashboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

   @Bean
   public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      http
            // Disable CSRF for REST API
            .csrf(AbstractHttpConfigurer::disable)
            // Security headers
            .headers(headers -> headers
                  // Allow same-origin frames (needed for H2 console in dev)
                  .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                  // Prevent MIME-type sniffing attacks
                  .contentTypeOptions(contentTypeOptions -> {})
                  // XSS protection
                  .xssProtection(xss -> xss
                        .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                  // HSTS — tell browsers to always use HTTPS
                  .httpStrictTransportSecurity(hsts -> hsts
                        .includeSubDomains(true)
                        .maxAgeInSeconds(31536000)))
            // Permit all endpoints (auth not required for this public dashboard)
            .authorizeHttpRequests(auth -> auth
                  .requestMatchers("/api/**").permitAll()
                  .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                  .requestMatchers("/h2-console/**").permitAll()
                  .requestMatchers("/actuator/health").permitAll()
                  .anyRequest().permitAll());

      return http.build();
   }
}