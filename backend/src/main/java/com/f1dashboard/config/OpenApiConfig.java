package com.f1dashboard.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger documentation configuration.
 * Access Swagger UI at: /swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI f1DashboardOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                    .title("F1 Dashboard API")
                    .description("Formula 1 Race Weekend Dashboard REST API. " +
                                 "Provides endpoints for drivers, constructors, races, " +
                                 "circuits, weather, and aggregated dashboard data.")
                    .version("1.0.0")
                    .contact(new Contact()
                        .name("F1 Dashboard")
                        .url("https://github.com/f1-dashboard")))
                .servers(List.of(
                    new Server().url("http://localhost:8080").description("Local Development")
                ));
    }
}
