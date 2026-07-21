package ca.macromap.api.controller;

import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.service.RestaurantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }


    @GetMapping("/pins")
    public List<RestaurantPin> getAll() {
        return restaurantService.getAllPins();
    }

}
