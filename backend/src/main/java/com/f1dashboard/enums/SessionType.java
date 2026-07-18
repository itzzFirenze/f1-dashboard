package com.f1dashboard.enums;

/**
 * Types of sessions in a race weekend.
 */
public enum SessionType {
    FP1("Free Practice 1"),
    FP2("Free Practice 2"),
    FP3("Free Practice 3"),
    SPRINT_QUALIFYING("Sprint Qualifying"),
    SPRINT("Sprint"),
    QUALIFYING("Qualifying"),
    RACE("Race");

    private final String displayName;

    SessionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
