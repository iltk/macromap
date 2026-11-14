/** Daily calorie & macro targets. */
export interface DailyTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very";
export type BodyGoal = "lose" | "maintain" | "gain";

export interface BodyProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: BodyGoal;
}

export const ACTIVITY: Record<Activity, { label: string; factor: number }> = {
  sedentary: { label: "Mostly sitting", factor: 1.2 },
  light: { label: "Light exercise 1–3 days/week", factor: 1.375 },
  moderate: { label: "Moderate exercise 3–5 days/week", factor: 1.55 },
  active: { label: "Hard exercise 6–7 days/week", factor: 1.725 },
  very: { label: "Physical job or twice-daily training", factor: 1.9 },
};

export const BODY_GOALS: Record<BodyGoal, string> = {
  lose: "Lose weight",
  maintain: "Maintain",
  gain: "Gain muscle",
};

/** Below this, show a warning: very low intakes should be supervised by a professional. */
export const LOW_CALORIE_WARNING = 1200;

/**
 * Estimate using the Mifflin-St Jeor equation × activity factor, then a modest
 * deficit/surplus. Protein by body weight, fat ~25% of calories, carbs the rest.
 * An estimate only: people vary.
 */
export function estimateTargets(p: BodyProfile): DailyTarget & { maintenance: number } {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const maintenance = bmr * ACTIVITY[p.activity].factor;
  const adjust = p.goal === "lose" ? -500 : p.goal === "gain" ? 300 : 0;
  const calories = Math.round((maintenance + adjust) / 10) * 10;
  const protein = Math.round(p.weightKg * (p.goal === "maintain" ? 1.6 : 2.0));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat, maintenance: Math.round(maintenance) };
}
