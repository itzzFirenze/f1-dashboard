package com.f1dashboard.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Development-only service to update the index.ts circuits source file directly.
 */
@Service
@Slf4j
@Profile({"dev", "default"})
public class DevCircuitService {

    @Value("${circuits.index.path}")
    private String indexPathString;

    /**
     * Locates the circuit by ID in index.ts and updates all supplied position properties.
     */
    public void updateCircuitPositions(
            String circuitId,
            List<Double> cornerPositions,
            Double sector1StartPercent,
            Double sector2StartPercent,
            Double sector3StartPercent,
            List<List<Double>> activeAeroRanges,
            Double overtakeDetectionPercent,
            Double overtakeActivationPercent,
            Double speedTrapPercent
    ) {
        Path path = Paths.get(indexPathString).normalize().toAbsolutePath();
        log.info("Updating circuit positions for: {} in file: {}", circuitId, path);

        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Circuits index file not found at path: " + path);
        }

        String fileContent;
        try {
            fileContent = Files.readString(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read circuits index file: " + e.getMessage(), e);
        }

        // 1. Locate the circuit block
        String block = extractCircuitBlock(fileContent, circuitId);
        int blockStart = fileContent.indexOf(block);
        String updatedBlock = block;

        // 2. Replace each non-null property
        if (cornerPositions != null && !cornerPositions.isEmpty()) {
            updatedBlock = replaceArrayProperty(updatedBlock, "cornerPositions", formatDoubleList(cornerPositions));
        }

        if (sector1StartPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "sector1StartPercent", formatDouble(sector1StartPercent));
        }
        if (sector2StartPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "sector2StartPercent", formatDouble(sector2StartPercent));
        }
        if (sector3StartPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "sector3StartPercent", formatDouble(sector3StartPercent));
        }

        if (activeAeroRanges != null) {
            String formatted = formatNestedArray(activeAeroRanges);
            updatedBlock = replaceNestedArrayProperty(updatedBlock, "activeAeroRanges", formatted);
        }

        if (overtakeDetectionPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "overtakeDetectionPercent", formatDouble(overtakeDetectionPercent));
        }
        if (overtakeActivationPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "overtakeActivationPercent", formatDouble(overtakeActivationPercent));
        }

        if (speedTrapPercent != null) {
            updatedBlock = replaceScalarProperty(updatedBlock, "speedTrapPercent", formatDouble(speedTrapPercent));
        }

        // 3. Write back
        String newFileContent = fileContent.substring(0, blockStart) + updatedBlock + fileContent.substring(blockStart + block.length());

        try {
            Files.writeString(path, newFileContent);
            log.info("Successfully updated circuit positions for {} in index.ts", circuitId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write updated content to index.ts: " + e.getMessage(), e);
        }
    }

    // ── Block extraction ───────────────────────────────────────────────────

    private String extractCircuitBlock(String fileContent, String circuitId) {
        String targetIdPattern = "id:\\s*['\"]" + Pattern.quote(circuitId) + "['\"]";
        Matcher idMatcher = Pattern.compile(targetIdPattern).matcher(fileContent);

        if (!idMatcher.find()) {
            throw new IllegalArgumentException("Circuit not found in index.ts: " + circuitId);
        }

        int idIndex = idMatcher.start();

        int blockStart = fileContent.lastIndexOf("buildCircuit({", idIndex);
        if (blockStart == -1) {
            throw new IllegalArgumentException("Failed to locate buildCircuit block for: " + circuitId);
        }

        int nextBlockStart = fileContent.indexOf("buildCircuit({", blockStart + 1);
        int arrayEnd = fileContent.indexOf("];", blockStart);
        int blockEnd = fileContent.length();

        if (nextBlockStart != -1 && (arrayEnd == -1 || nextBlockStart < arrayEnd)) {
            blockEnd = nextBlockStart;
        } else if (arrayEnd != -1) {
            blockEnd = arrayEnd;
        }

        return fileContent.substring(blockStart, blockEnd);
    }

    // ── Property replacement helpers ───────────────────────────────────────

    private String appendPropertyToBlock(String block, String propertyName, String newValue, boolean isArray) {
        int lastBrace = block.lastIndexOf('}');
        if (lastBrace == -1) return block;

        String beforeBrace = block.substring(0, lastBrace);
        String trimmedBefore = beforeBrace.trim();
        boolean endsWithComma = trimmedBefore.endsWith(",");

        String prefix = endsWithComma ? " " : ", ";
        String formattedValue = isArray ? "[" + newValue + "]" : newValue;

        String insertValue = prefix + propertyName + ": " + formattedValue;
        return block.substring(0, lastBrace) + insertValue + block.substring(lastBrace);
    }

    /**
     * Replace a simple array property like: cornerPositions: [1, 2, 3]
     */
    private String replaceArrayProperty(String block, String propertyName, String newValue) {
        Pattern p = Pattern.compile(propertyName + "\\s*:\\s*\\[[^\\]]*\\]");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.replaceFirst(propertyName + ": [" + newValue + "]");
        }
        return appendPropertyToBlock(block, propertyName, newValue, true);
    }

    /**
     * Replace a nested array property like: activeAeroRanges: [[1, 2], [3, 4]]
     */
    private String replaceNestedArrayProperty(String block, String propertyName, String newValue) {
        // Match activeAeroRanges: [[...], [...]] — greedy within the outermost brackets
        Pattern p = Pattern.compile(propertyName + "\\s*:\\s*\\[\\[.*?\\]\\]");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.replaceFirst(Matcher.quoteReplacement(propertyName + ": " + newValue));
        }
        return appendPropertyToBlock(block, propertyName, newValue, false);
    }

    /**
     * Replace a scalar property like: overtakeDetectionPercent: 80
     */
    private String replaceScalarProperty(String block, String propertyName, String newValue) {
        // Match the property name followed by colon, optional space, then a number (possibly negative, with decimals)
        Pattern p = Pattern.compile(propertyName + "\\s*:\\s*[\\d.]+");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.replaceFirst(propertyName + ": " + newValue);
        }
        return appendPropertyToBlock(block, propertyName, newValue, false);
    }

    // ── Formatting helpers ─────────────────────────────────────────────────

    private String formatDoubleList(List<Double> values) {
        return values.stream()
                .map(this::formatDouble)
                .collect(Collectors.joining(", "));
    }

    private String formatNestedArray(List<List<Double>> ranges) {
        String inner = ranges.stream()
                .map(pair -> "[" + pair.stream().map(this::formatDouble).collect(Collectors.joining(", ")) + "]")
                .collect(Collectors.joining(", "));
        return "[" + inner + "]";
    }

    private String formatDouble(Double d) {
        if (d == null) return "null";
        if (d == Math.floor(d) && !Double.isInfinite(d)) {
            return String.valueOf(d.longValue());
        }
        return String.valueOf(d);
    }
}
