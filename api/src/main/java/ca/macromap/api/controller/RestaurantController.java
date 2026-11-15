package ca.macromap.api.controller;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MacroGoal;
import ca.macromap.api.dto.RestaurantMenu;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.search.SearchService;
import ca.macromap.api.service.RestaurantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final SearchService searchService;

    public RestaurantController(RestaurantService restaurantService, SearchService searchService) {
        this.restaurantService = restaurantService;
        this.searchService = searchService;
    }

    @GetMapping("/restaurants/pins")
    public List<RestaurantPin> getAllPins() {
        return restaurantService.getAllPins();
    }

    /** Directory. Optional goal params make {@code matchingItems} count only items that fit. */
    @GetMapping("/restaurants")
    public List<RestaurantSummary> getAllRestaurants(
            @RequestParam(required = false) Integer maxCalories,
            @RequestParam(required = false) BigDecimal minProtein,
            @RequestParam(required = false) BigDecimal maxCarbs) {
        return restaurantService.getAllRestaurants(new MacroGoal(maxCalories, minProtein, maxCarbs));
    }

    @GetMapping("/restaurants/{slug}")
    public RestaurantMenu getRestaurantMenu(@PathVariable String slug) {
        return restaurantService.getRestaurantMenu(slug);
    }

    @GetMapping("/locations/{id}")
    public LocationDetails getLocation(@PathVariable UUID id) {
        return restaurantService.getLocationDetails(id);
    }

    @GetMapping("/search")
    public SearchResponse search(@RequestParam(name = "q", defaultValue = "") String q) {
        return searchService.search(q);
    }
}
