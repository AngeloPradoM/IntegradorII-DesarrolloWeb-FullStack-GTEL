import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import LandingPage from "../pages/candidato/LandingPage";
import OfertasLaboralesPage from "../pages/candidato/OfertasLaboralesPage";
import FormularioPostulacionPage from "../pages/candidato/FormularioPostulacionPage";
import MisPostulacionesPage from "../pages/candidato/MisPostulacionesPage";
import LoginPage from "../pages/auth/LoginPage";

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
      </Routes>
    </BrowserRouter>
  );
}