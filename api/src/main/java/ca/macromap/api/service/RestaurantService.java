package ca.macromap.api.service;

import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.repository.RestaurantLocRepository;
import org.springframework.stereotype.Service;

import java.util.List;
//TODO: add validation and filtering
@Service
public class RestaurantService {

    private final RestaurantLocRepository restaurantLocRepository;


    public RestaurantService(RestaurantLocRepository restaurantLocRepository) {
        this.restaurantLocRepository = restaurantLocRepository;
    }

    public List<RestaurantPin> getAllPins() {
        return restaurantLocRepository.findAllPins();
    }
}
