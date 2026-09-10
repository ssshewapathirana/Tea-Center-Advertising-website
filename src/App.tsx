import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import HomePage from "./pages/public/HomePage";
import TeaFinderPage from "./pages/public/TeaFinderPage";
import TeaDetailPage from "./pages/public/TeaDetailPage";
import GradesPage from "./pages/public/GradesPage";
import AboutPage from "./pages/public/AboutPage";
import NotFoundPage from "./pages/public/NotFoundPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import TeaCataloguePage from "./pages/admin/TeaCataloguePage";
import TeaEditPage from "./pages/admin/TeaEditPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import PricesPage from "./pages/admin/PricesPage";
import BulkPricePage from "./pages/admin/BulkPricePage";
import PriceHistoryPage from "./pages/admin/PriceHistoryPage";
import AvailabilityPage from "./pages/admin/AvailabilityPage";
import ActivityPage from "./pages/admin/ActivityPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ImagesPage from "./pages/admin/ImagesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tea" element={<TeaFinderPage />} />
          <Route path="tea/:slug" element={<TeaDetailPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tea" element={<TeaCataloguePage />} />
          <Route path="tea/:id" element={<TeaEditPage />} />
          <Route path="tea/:id/edit" element={<TeaEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="prices/bulk" element={<BulkPricePage />} />
          <Route path="prices/history" element={<PriceHistoryPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="images" element={<ImagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
