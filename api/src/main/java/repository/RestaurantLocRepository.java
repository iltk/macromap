package repository;

import entity.RestaurantLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RestaurantLocRepository extends JpaRepository<RestaurantLocation, UUID> {
}
