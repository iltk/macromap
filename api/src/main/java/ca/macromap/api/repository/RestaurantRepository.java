package ca.macromap.api.repository;

import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findBySlug(String slug);

    @Query("""
        SELECT new ca.macromap.api.dto.RestaurantSummary(
            r.id, r.slug, r.name, r.category, r.description, r.brandColor, r.logoUrl,
            (SELECT COUNT(rl) FROM RestaurantLocation rl WHERE rl.restaurant = r),
            (SELECT COUNT(m) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT MIN(m.calories) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT MAX(m.protein) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT COUNT(m) FROM MenuItem m WHERE m.restaurant = r
                AND m.calories <= :maxCalories AND m.protein >= :minProtein AND m.carbs <= :maxCarbs))
        FROM Restaurant r
        ORDER BY LOWER(r.name)
        """)
    List<RestaurantSummary> findAllSummaries(int maxCalories, BigDecimal minProtein, BigDecimal maxCarbs);

}
