import { BrowserRouter, Route, Routes } from "react-router";
import { Sheets } from "./components/sheets/Sheets";
import { Notifier } from "./components/ui/Notifier";
import { TrackerPage } from "./pages/TrackerPage";
import { ThemeController } from "./stores/theme";
import { MapPage } from "./pages/MapPage";
import { RestaurantMenuPage } from "./pages/RestaurantMenuPage";
import { RestaurantsPage } from "./pages/RestaurantsPage";

function App() {
  return (
    <BrowserRouter>
      <ThemeController />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/:slug" element={<RestaurantMenuPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="*" element={<MapPage />} />
      </Routes>
      <Sheets />
      <Notifier />
    </BrowserRouter>
  );
}

export default App;
