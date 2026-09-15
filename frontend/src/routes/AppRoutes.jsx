import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import LandingPage from "../pages/candidato/LandingPage";
import OfertasLaboralesPage from "../pages/candidato/OfertasLaboralesPage";
import FormularioPostulacionPage from "../pages/candidato/FormularioPostulacionPage";
import MisPostulacionesPage from "../pages/candidato/MisPostulacionesPage";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/reclutador/DashboardPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ofertas" element={<OfertasLaboralesPage />} />
          <Route path="/postulacion" element={<FormularioPostulacionPage />} />
          <Route path="/mis-postulaciones" element={<MisPostulacionesPage />} />
        </Route>
        <Route path="/reclutador" element={<RecruiterLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}