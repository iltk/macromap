import { use, useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

function App() {
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 15,
  });

  const [userLongitude, setUserLongitude] = useState(0)
  const [userLatitude, setUserLatitude] = useState(0)


  function getUserLocation() {
    // Check if the browser supports the Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  // Handles successful location retrieval
  function successCallback(position: any) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    setViewState({ longitude: longitude, latitude: latitude, zoom: 15 });
    setUserLatitude(latitude);
    setUserLongitude(longitude);

    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  }

  // Handles errors (e.g., user denied permission)
  function errorCallback(error: any) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        console.error("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        console.error("The request to get user location timed out.");
        break;
      default:
        console.error("An unknown error occurred.");
        break;
    }
  }

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fet = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/restaurants/pins", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled) setData(json);
      } catch (err: any) {
        if (err.name !== "AbortError" && !cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fet();
    getUserLocation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  console.log(data);

  return (
    <div className="h-screen w-screen">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://api.maptiler.com/maps/hybrid-v4/style.json?key=IVtsnHXRqn5BREdDdOlE"
      >
        <Marker longitude={userLongitude} latitude={userLatitude}>
          <div className="h-4 w-4 rounded-full bg-blue-500  ring-2 ring-white shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee] filter drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
        </Marker>
      </Map>
    </div>
  );
}

export default App;
