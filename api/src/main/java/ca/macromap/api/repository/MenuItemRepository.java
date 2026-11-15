package ca.macromap.api.repository;

import ca.macromap.api.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    List<MenuItem> findByRestaurantIdOrderByMenuCategoryAscNameAsc(Long restaurantId);

    @Query("SELECT m FROM MenuItem m JOIN FETCH m.restaurant ORDER BY m.restaurant.name, m.menuCategory, m.name")
    List<MenuItem> findAllWithRestaurant();

}
