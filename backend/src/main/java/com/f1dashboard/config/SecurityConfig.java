package com.f1dashboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

   @Bean
   public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      http
            // Disable CSRF for REST API
            .csrf(AbstractHttpConfigurer::disable)
            // Allow H2 console frames
            .headers(headers -> headers
                  .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
            // Permit all endpoints
            .authorizeHttpRequests(auth -> auth
                  .requestMatchers("/api/**").permitAll()
                  .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                  .requestMatchers("/h2-console/**").permitAll()
                  .requestMatchers("/actuator/**").permitAll()
                  .anyRequest().permitAll());

      return http.build();
   }
}