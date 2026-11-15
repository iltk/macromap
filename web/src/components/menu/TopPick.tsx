import type { MenuItem } from "../../types/venues";

export function TopPick({ item, onShow, forGoal }: { item: MenuItem; onShow?: () => void; forGoal: string | null }) {
  return (
    <p className="text-sm text-gray-700">
      {forGoal ? <>Best match for {forGoal.toLowerCase()}: </> : <>Most protein per calorie: </>}
      {onShow ? (
        <button type="button" onClick={onShow} className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
          {item.name}
        </button>
      ) : (
        <span className="font-semibold text-gray-900">{item.name}</span>
      )}{" "}
      <span className="text-gray-500 tabular-nums">
        ({item.protein} g protein, {item.calories} cal)
      </span>
    </p>
  );
}
