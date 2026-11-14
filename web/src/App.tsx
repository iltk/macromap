import { BrowserRouter, Route, Routes } from "react-router";
import { MapPage } from "./pages/MapPage";
import { RestaurantMenuPage } from "./pages/RestaurantMenuPage";
import { RestaurantsPage } from "./pages/RestaurantsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/:slug" element={<RestaurantMenuPage />} />
        <Route path="*" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
