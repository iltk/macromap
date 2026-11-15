package ca.macromap.api.dto;

import java.math.BigDecimal;

/** Optional macro limits; null means "no limit". */
public record MacroGoal(Integer maxCalories, BigDecimal minProtein, BigDecimal maxCarbs) {

    public static final MacroGoal NONE = new MacroGoal(null, null, null);

    private static final int NO_CALORIE_LIMIT = Integer.MAX_VALUE;
    private static final BigDecimal NO_CARB_LIMIT = new BigDecimal("1000000");

    public int caloriesCeiling() {
        return maxCalories == null ? NO_CALORIE_LIMIT : maxCalories;
    }

    public BigDecimal proteinFloor() {
        return minProtein == null ? BigDecimal.ZERO : minProtein;
    }

    public BigDecimal carbsCeiling() {
        return maxCarbs == null ? NO_CARB_LIMIT : maxCarbs;
    }
}
