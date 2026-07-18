package com.f1dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * F1 Dashboard Application - Main entry point.
 * 
 * A production-quality Formula 1 Race Weekend Dashboard providing
 * season tracking, driver/constructor standings, race schedules,
 * circuit exploration, weather integration, and statistics.
 */
@SpringBootApplication
@EnableScheduling
public class F1DashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(F1DashboardApplication.class, args);
    }
}
