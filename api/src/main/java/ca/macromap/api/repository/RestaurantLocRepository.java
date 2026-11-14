package ca.macromap.api.repository;

import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.entity.RestaurantLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantLocRepository extends JpaRepository<RestaurantLocation, UUID> {

    @Query("""
        SELECT new ca.macromap.api.dto.RestaurantPin(
            rl.id, r.id, r.slug, r.name, r.category, r.brandColor, rl.latitude, rl.longitude, rl.openingHours)
        FROM RestaurantLocation rl
        JOIN rl.restaurant r
        """)
    List<RestaurantPin> findAllPins();

    @Query("SELECT rl FROM RestaurantLocation rl JOIN FETCH rl.restaurant WHERE rl.id = :id")
    Optional<RestaurantLocation> findWithRestaurantById(UUID id);

    long countByRestaurantId(Long restaurantId);
}
