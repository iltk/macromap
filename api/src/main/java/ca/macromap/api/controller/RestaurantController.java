package ca.macromap.api.controller;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.service.RestaurantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/restaurants/pins")
    public List<RestaurantPin> getAllPins() {
        return restaurantService.getAllPins();
    }

    @GetMapping("/locations/{id}")
    public LocationDetails getLocation(@PathVariable UUID id) {
        return restaurantService.getLocationDetails(id);
    }

    @GetMapping("/search")
    public SearchResponse search(@RequestParam(name = "q", defaultValue = "") String q) {
        return restaurantService.search(q);
    }
}
