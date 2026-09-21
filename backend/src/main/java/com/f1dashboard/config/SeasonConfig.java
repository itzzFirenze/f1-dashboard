package com.f1dashboard.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Centralised source of truth for the active F1 season.
 *
 * <p>Inject this bean instead of using {@code private static final int CURRENT_SEASON = 2026}
 * scattered across services. The value is driven by {@code app.season.current} in
 * {@code application.yml}, which in turn resolves the {@code CURRENT_SEASON} environment variable
 * (defaulting to 2026). Change the season by setting {@code CURRENT_SEASON=2027} in the
 * environment — no recompilation required.
 */
@Getter
@Component
public class SeasonConfig {

    @Value("${app.season.current:2026}")
    private int currentSeason;
}
