package com.f1dashboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

   /**
    * The Supabase project URL is needed in the CSP so the browser can connect
    * to Supabase for trivia queries. Loaded from the environment; defaults to
    * a wildcard supabase.co subdomain so the app still starts without the env var.
    */
   @Value("${app.supabase.url:https://*.supabase.co}")
   private String supabaseUrl;

   @Bean
   public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
      http
            // Disable CSRF — this is a stateless REST API; no session cookies
            .csrf(AbstractHttpConfigurer::disable)

            // ── Security Headers ───────────────────────────────────────────
            .headers(headers -> headers
                  // X-Frame-Options: DENY — prevent clickjacking on all origins
                  .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)

                  // X-Content-Type-Options: nosniff — prevent MIME sniffing
                  .contentTypeOptions(contentTypeOptions -> {})

                  // X-XSS-Protection: 1; mode=block (legacy browsers)
                  .xssProtection(xss -> xss
                        .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))

                  // Strict-Transport-Security: max-age=31536000; includeSubDomains
                  .httpStrictTransportSecurity(hsts -> hsts
                        .includeSubDomains(true)
                        .preload(true)
                        .maxAgeInSeconds(31536000))

                  // Referrer-Policy: strict-origin-when-cross-origin
                  .referrerPolicy(referrer -> referrer
                        .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))

                  // Content-Security-Policy
                  // - default-src 'self'  → only load resources from our own origin
                  // - connect-src 'self' <supabaseUrl>  → allow XHR/fetch to our API and Supabase
                  // - img-src 'self' data: https:  → permit data URIs and any HTTPS image source
                  // - font-src 'self' https://fonts.gstatic.com  → Google Fonts
                  // - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com → inline styles (Tailwind) + Google Fonts CSS
                  .addHeaderWriter(new StaticHeadersWriter(
                        "Content-Security-Policy",
                        "default-src 'self'; " +
                        "connect-src 'self' " + supabaseUrl + " https://api.openf1.org; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self' https://fonts.gstatic.com; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "script-src 'self'; " +
                        "frame-src 'none'; " +
                        "object-src 'none'; " +
                        "base-uri 'self';"
                  ))

                  // Permissions-Policy — disable browser features we don't need
                  .addHeaderWriter(new StaticHeadersWriter(
                        "Permissions-Policy",
                        "camera=(), microphone=(), geolocation=(), payment=()"
                  ))
            )

            // ── Endpoint Authorization ─────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                  // Public API endpoints
                  .requestMatchers("/api/**").permitAll()
                  // Actuator health check only (metrics etc. are not exposed)
                  .requestMatchers("/actuator/health").permitAll()
                  // Deny everything else by default
                  // NOTE: Swagger and H2 console are intentionally NOT permitted here.
                  //       Swagger is disabled in the default (production) profile via application.yml.
                  //       H2 console is also disabled in the default profile.
                  //       They are only accessible in the 'dev' profile via application-dev.yml.
                  .anyRequest().denyAll()
            );

      return http.build();
   }
}