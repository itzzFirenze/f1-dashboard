package com.f1dashboard.util;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

public class CircuitDataSeeder {

    @Getter
    @AllArgsConstructor
    public static class CircuitStats {
        private Double lengthKm;
        private Integer corners;
        private String lapRecord;
        private String lapRecordHolder;
    }

    private static final Map<String, CircuitStats> CIRCUIT_DATA = new HashMap<>();

    static {
        CIRCUIT_DATA.put("bahrain", new CircuitStats(5.412, 15, "1:31.447", "Pedro de la Rosa (2005)"));
        CIRCUIT_DATA.put("jeddah", new CircuitStats(6.174, 27, "1:30.734", "Lewis Hamilton (2021)"));
        CIRCUIT_DATA.put("albert_park", new CircuitStats(5.278, 14, "1:19.813", "Charles Leclerc (2024)"));
        CIRCUIT_DATA.put("suzuka", new CircuitStats(5.807, 18, "1:30.983", "Lewis Hamilton (2019)"));
        CIRCUIT_DATA.put("shanghai", new CircuitStats(5.451, 16, "1:32.238", "Michael Schumacher (2004)"));
        CIRCUIT_DATA.put("miami", new CircuitStats(5.412, 19, "1:29.708", "Max Verstappen (2023)"));
        CIRCUIT_DATA.put("imola", new CircuitStats(4.909, 19, "1:15.484", "Lewis Hamilton (2020)"));
        CIRCUIT_DATA.put("monaco", new CircuitStats(3.337, 19, "1:12.909", "Lewis Hamilton (2021)"));
        CIRCUIT_DATA.put("villeneuve", new CircuitStats(4.361, 14, "1:13.078", "Valtteri Bottas (2019)"));
        CIRCUIT_DATA.put("catalunya", new CircuitStats(4.657, 14, "1:16.330", "Max Verstappen (2023)"));
        CIRCUIT_DATA.put("red_bull_ring", new CircuitStats(4.318, 10, "1:05.619", "Carlos Sainz (2020)"));
        CIRCUIT_DATA.put("silverstone", new CircuitStats(5.891, 18, "1:27.097", "Max Verstappen (2020)"));
        CIRCUIT_DATA.put("hungaroring", new CircuitStats(4.381, 14, "1:16.627", "Lewis Hamilton (2020)"));
        CIRCUIT_DATA.put("spa", new CircuitStats(7.004, 19, "1:46.286", "Valtteri Bottas (2018)"));
        CIRCUIT_DATA.put("zandvoort", new CircuitStats(4.259, 14, "1:11.097", "Lewis Hamilton (2021)"));
        CIRCUIT_DATA.put("monza", new CircuitStats(5.793, 11, "1:21.046", "Rubens Barrichello (2004)"));
        CIRCUIT_DATA.put("baku", new CircuitStats(6.003, 20, "1:43.009", "Charles Leclerc (2019)"));
        CIRCUIT_DATA.put("marina_bay", new CircuitStats(4.940, 19, "1:35.867", "Lewis Hamilton (2023)"));
        CIRCUIT_DATA.put("americas", new CircuitStats(5.513, 20, "1:36.169", "Charles Leclerc (2019)"));
        CIRCUIT_DATA.put("rodriguez", new CircuitStats(4.304, 17, "1:17.774", "Valtteri Bottas (2021)"));
        CIRCUIT_DATA.put("interlagos", new CircuitStats(4.309, 15, "1:10.540", "Valtteri Bottas (2018)"));
        CIRCUIT_DATA.put("vegas", new CircuitStats(6.201, 17, "1:35.490", "Oscar Piastri (2023)"));
        CIRCUIT_DATA.put("losail", new CircuitStats(5.419, 16, "1:24.319", "Max Verstappen (2023)"));
        CIRCUIT_DATA.put("yas_marina", new CircuitStats(5.281, 16, "1:26.103", "Max Verstappen (2021)"));
    }

    public static CircuitStats getStats(String circuitRef) {
        return CIRCUIT_DATA.getOrDefault(circuitRef, new CircuitStats(5.0, 15, "N/A", "N/A"));
    }
}
