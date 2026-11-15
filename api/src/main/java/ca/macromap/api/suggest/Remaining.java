package ca.macromap.api.suggest;

/**
 * What's left of the viewer's daily targets. Any value may be null (= no target for it);
 * values can be zero or negative once a target is reached.
 */
public record Remaining(Integer calories, Double protein, Double carbs, Double fat, MealTime meal) {

    public Remaining(Integer calories, Double protein, Double carbs, Double fat) {
        this(calories, protein, carbs, fat, null);
    }

    /** A typical single meal size, used when a lot of the day's budget is still open. */
    static final double MEAL_CALORIES = 650;
    static final double SNACK_CALORIES = 300;
    static final double COMBO_CALORIES = 850;

    double idealCalories(boolean combo) {
        double cap = meal == MealTime.SNACK ? SNACK_CALORIES : combo ? COMBO_CALORIES : MEAL_CALORIES;
        return calories == null ? cap : Math.max(150, Math.min(calories, cap));
    }
}
