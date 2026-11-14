package ca.macromap.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Lightweight marker data for every location on the map. */
public record RestaurantPin(
        UUID locationId,
        Long restaurantId,
        String slug,
        String name,
        String category,
        BigDecimal latitude,
        BigDecimal longitude
) {}
