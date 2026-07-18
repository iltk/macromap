package ca.macromap.api.dto;
import java.math.BigDecimal;
import java.util.UUID;



public record RestaurantPin(
        UUID locationId,

        //restaurant name
        String name,
        BigDecimal latitude,
        BigDecimal longitude
) {}