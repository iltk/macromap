package entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Table(name="restaurant_locations")
public class RestaurantLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY) // Always use LAZY fetch for performance
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(name = "latitude",nullable = false ,precision = 5, scale = 2)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false,precision = 5, scale = 2)
    private BigDecimal longitude;

    @Column(name="address",nullable = false)
    private String address;




}
