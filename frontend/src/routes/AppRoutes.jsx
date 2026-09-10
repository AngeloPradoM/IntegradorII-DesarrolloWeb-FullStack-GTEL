import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/candidato/LandingPage";
import OfertasLaboralesPage from "../pages/candidato/OfertasLaboralesPage";
import FormularioPostulacionPage from "../pages/candidato/FormularioPostulacionPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />  
        <Route path="/ofertas" element={<OfertasLaboralesPage />} />
        <Route path="/postulacion" element={<FormularioPostulacionPage />} />
      </Routes>
    </BrowserRouter>
  );
}