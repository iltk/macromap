import { Marker } from "react-map-gl/maplibre";
import type { Coordinates } from "../../types/venues";

interface UserPositionMarkerProps {
  position: Coordinates | null;
}

export function UserPositionMarker({ position }: UserPositionMarkerProps) {
  if (!position) return null;

  return (
    <Marker
      longitude={position.lng}
      latitude={position.lat}
      anchor="center"
    >
      <div className="h-4 w-4 rounded-full bg-blue-500 ring-2 ring-white shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
    </Marker>
  );
}
