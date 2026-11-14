package ca.macromap.api.entity;


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

    @Column(name = "latitude",nullable = false ,precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false,precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name="address",nullable = false)
    private String address;

    @Column(name = "osm_id", unique = true)
    private Long osmId;

    @Column(name = "phone")
    private String phone;

    @Column(name = "opening_hours")
    private String openingHours;

    @Column(name = "city")
    private String city;




}
