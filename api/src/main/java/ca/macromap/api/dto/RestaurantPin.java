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
        String brandColor,
        BigDecimal latitude,
        BigDecimal longitude,
        /* raw OpenStreetMap opening_hours, null when unknown */
        String openingHours
) {}
