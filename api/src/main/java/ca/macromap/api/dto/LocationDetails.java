package ca.macromap.api.dto;

import ca.macromap.api.entity.Restaurant;
import ca.macromap.api.entity.RestaurantLocation;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Everything the details panel needs for one location, including the chain's menu. */
public record LocationDetails(
        UUID locationId,
        Long restaurantId,
        String slug,
        String name,
        String category,
        String brandColor,
        String website,
        String address,
        String city,
        String phone,
        String openingHours,
        BigDecimal latitude,
        BigDecimal longitude,
        List<MenuItemDto> menu
) {
    public static LocationDetails from(RestaurantLocation loc, List<MenuItemDto> menu) {
        Restaurant r = loc.getRestaurant();
        return new LocationDetails(loc.getId(), r.getId(), r.getSlug(), r.getName(), r.getCategory(),
                r.getBrandColor(), r.getWebsite(), loc.getAddress(), loc.getCity(), loc.getPhone(), loc.getOpeningHours(),
                loc.getLatitude(), loc.getLongitude(), menu);
    }
}
