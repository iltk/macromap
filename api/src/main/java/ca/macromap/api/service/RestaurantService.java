package ca.macromap.api.service;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.entity.RestaurantLocation;
import ca.macromap.api.exception.NotFoundException;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class RestaurantService {

    static final int MAX_QUERY_LENGTH = 100;
    private static final Limit RESTAURANT_HITS = Limit.of(5);
    private static final Limit ITEM_HITS = Limit.of(10);

    private final RestaurantLocRepository locationRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantService(RestaurantLocRepository locationRepository,
                             RestaurantRepository restaurantRepository,
                             MenuItemRepository menuItemRepository) {
        this.locationRepository = locationRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public List<RestaurantPin> getAllPins() {
        return locationRepository.findAllPins();
    }

    public LocationDetails getLocationDetails(UUID locationId) {
        RestaurantLocation loc = locationRepository.findWithRestaurantById(locationId)
                .orElseThrow(() -> new NotFoundException("Location " + locationId + " not found"));
        List<MenuItemDto> menu = menuItemRepository
                .findByRestaurantIdOrderByMenuCategoryAscNameAsc(loc.getRestaurant().getId())
                .stream().map(MenuItemDto::from).toList();
        return LocationDetails.from(loc, menu);
    }

    public SearchResponse search(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return SearchResponse.empty();
        }
        String q = rawQuery.strip();
        if (q.length() > MAX_QUERY_LENGTH) {
            q = q.substring(0, MAX_QUERY_LENGTH);
        }
        String pattern = "%" + escapeLike(q.toLowerCase(Locale.ROOT)) + "%";
        return new SearchResponse(
                restaurantRepository.searchByName(pattern, RESTAURANT_HITS),
                menuItemRepository.searchByName(pattern, ITEM_HITS));
    }

    static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
