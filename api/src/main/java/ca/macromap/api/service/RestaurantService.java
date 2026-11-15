package ca.macromap.api.service;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MacroGoal;
import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.RestaurantMenu;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.entity.Restaurant;
import ca.macromap.api.entity.RestaurantLocation;
import ca.macromap.api.exception.NotFoundException;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class RestaurantService {

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

    public List<RestaurantSummary> getAllRestaurants(MacroGoal goal) {
        return restaurantRepository.findAllSummaries(
                goal.caloriesCeiling(), goal.proteinFloor(), goal.carbsCeiling());
    }

    public RestaurantMenu getRestaurantMenu(String slug) {
        Restaurant r = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Restaurant '" + slug + "' not found"));
        return RestaurantMenu.from(r, locationRepository.countByRestaurantId(r.getId()), menuFor(r.getId()));
    }

    public LocationDetails getLocationDetails(UUID locationId) {
        RestaurantLocation loc = locationRepository.findWithRestaurantById(locationId)
                .orElseThrow(() -> new NotFoundException("Location " + locationId + " not found"));
        return LocationDetails.from(loc, menuFor(loc.getRestaurant().getId()));
    }

    private List<MenuItemDto> menuFor(Long restaurantId) {
        return menuItemRepository.findByRestaurantIdOrderByMenuCategoryAscNameAsc(restaurantId)
                .stream().map(MenuItemDto::from).toList();
    }
}
