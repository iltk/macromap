package ca.macromap.api.repository;

import ca.macromap.api.dto.SearchResponse.MenuItemHit;
import ca.macromap.api.entity.MenuItem;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    List<MenuItem> findByRestaurantIdOrderByMenuCategoryAscNameAsc(Long restaurantId);

    /** {@code pattern} is a lower-cased LIKE pattern, e.g. {@code %teen%}. */
    @Query("""
        SELECT new ca.macromap.api.dto.SearchResponse$MenuItemHit(
            m.id, r.id, r.slug, r.name, m.name, m.calories, m.protein)
        FROM MenuItem m JOIN m.restaurant r
        WHERE LOWER(m.name) LIKE :pattern ESCAPE '\\'
           OR LOWER(m.menuCategory) LIKE :pattern ESCAPE '\\'
        ORDER BY r.name, m.name
        """)
    List<MenuItemHit> searchByName(String pattern, Limit limit);
}
