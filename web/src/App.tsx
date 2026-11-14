import { BrowserRouter, Route, Routes } from "react-router";
import { Sheets } from "./components/sheets/Sheets";
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
        <Route path="*" element={<MapPage />} />
      </Routes>
      <Sheets />
    </BrowserRouter>
  );
}

export default App;
