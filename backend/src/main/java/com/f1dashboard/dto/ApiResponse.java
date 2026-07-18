package com.f1dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standardized API response wrapper.
 * Wraps all API responses for consistent structure.
 *
 * @param <T> the type of data being returned
 */
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    LocalDateTime timestamp
) {
    /** Create a successful response with data */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, LocalDateTime.now());
    }

    /** Create a successful response with a message */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, LocalDateTime.now());
    }

    /** Create an error response */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, LocalDateTime.now());
    }
}
