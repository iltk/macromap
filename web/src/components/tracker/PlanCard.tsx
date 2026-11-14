import { Link } from "react-router";
import { totalsOf, useTracker } from "../../stores/tracker";
import { ui } from "../ui/styles";

/** Short summary of the meal being built, linking to the full builder. */
export function PlanCard() {
  const { plan } = useTracker();
  const t = totalsOf(plan);
  return (
    <section className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <h2 className="text-sm font-semibold text-gray-900">Build a meal</h2>
      {plan.length === 0 ? (
        <>
          <p className="mt-1 text-sm text-gray-600">Put an order together and see how it fits before you buy.</p>
          <Link to="/build" className={`mt-3 ${ui.btn}`}>
            Start building
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-700 tabular-nums">
            {t.count} {t.count === 1 ? "item" : "items"} in progress · <span className="font-semibold">{Math.round(t.calories)} cal</span> ·{" "}
            {Math.round(t.protein)} g protein
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{plan.map((p) => p.item.name).join(", ")}</p>
          <Link to={`/build?r=${plan[plan.length - 1].item.restaurantSlug}`} className={`mt-3 ${ui.btnPrimary}`}>
            Continue building
          </Link>
        </>
      )}
    </section>
  );
}
