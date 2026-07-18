package ca.macromap.api.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table(name="menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY) // Always use LAZY fetch for performance
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "menu_category")
    private String menuCategory;

    @Column(name = "serving_size")
    private String servingSize;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "protein", precision = 5, scale = 2)
    private BigDecimal protein;

    @Column(name = "carbs", precision = 5, scale = 2)
    private BigDecimal carbs;

    @Column(name = "fat", precision = 5, scale = 2)
    private BigDecimal fat;

    @Column(name = "allergens")
    private String allergens;

    @Column(name = "source")
    private String source;

    @Column(name = "last_verified")
    private LocalDate lastVerified;





}

