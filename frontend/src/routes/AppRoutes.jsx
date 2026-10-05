import JobTrash from '../pages/reclutador/JobTrash';
import RecoveryPage from '../pages/auth/RecoveryPage';
import AuditPage from '../pages/admin/AuditPage';
import NotificationsPage from '../pages/candidato/NotificationsPage';
import SelectionWorkspace from '../pages/reclutador/SelectionWorkspace';
import JobEditor from '../pages/reclutador/JobEditor';
import AdminUsersPage from "../pages/admin/UsersPage";
import LoginModalRedirect from "../pages/auth/LoginModalRedirect";
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import LandingPage from "../pages/candidato/LandingPage";
import OfertasLaboralesPage from "../pages/candidato/OfertasLaboralesPage";
import FormularioPostulacionPage from "../pages/candidato/FormularioPostulacionPage";
import MisPostulacionesPage from "../pages/candidato/MisPostulacionesPage";
import OfertaDetallePage from "../pages/candidato/OfertaDetallePage";
import PerfilPage from "../pages/candidato/PerfilPage";
import ContactarReclutadorPage from "../pages/candidato/ContactarReclutadorPage";
import PerfilCandidatoPage from "../pages/reclutador/PerfilCandidatoPage";
import DashboardPage from "../pages/reclutador/DashboardPage";
import PublicarOfertaPage from "../pages/reclutador/PublicarOfertaPage";
import PostulantesPage from "../pages/reclutador/PostulantesPage";
import EntrevistasPage from "../pages/reclutador/EntrevistasPage";
import EvaluacionesPage from "../pages/reclutador/EvaluacionesPage";
import RecruiterJobs, { RecruiterJobDetail } from "../pages/reclutador/OfertasPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import NotFoundPage from "../pages/NotFoundPage";

const router = createBrowserRouter(createRoutesFromElements(<>
        <Route path="/login" element={<LoginModalRedirect />} />

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/recuperar-acceso" element={<RecoveryPage />} />
          <Route path="/notificaciones" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/auditoria" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/ofertas" element={<OfertasLaboralesPage />} />
          <Route path="/ofertas/:id" element={<OfertaDetallePage />} />
          <Route path="/postulacion" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><FormularioPostulacionPage /></ProtectedRoute>} />
          <Route path="/postulacion/:id" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><FormularioPostulacionPage /></ProtectedRoute>} />
          <Route path="/contactar-reclutador" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><ContactarReclutadorPage /></ProtectedRoute>} />
          <Route path="/mis-postulaciones" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><MisPostulacionesPage /></ProtectedRoute>} />
          <Route path="/candidato" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><MisPostulacionesPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute allowedRoles={["CANDIDATO", "RECLUTADOR"]}><PerfilPage /></ProtectedRoute>} />
        </Route>

        <Route path="/reclutador" element={<ProtectedRoute allowedRoles={["RECLUTADOR"]}><RecruiterLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="ofertas" element={<RecruiterJobs />} />
          <Route path="ofertas/papelera" element={<JobTrash />} />
          <Route path="ofertas/:id" element={<RecruiterJobDetail />} />
          <Route path="ofertas/:id/editar" element={<JobEditor />} />
          <Route path="seleccion" element={<SelectionWorkspace />} />
          <Route path="publicar-oferta" element={<PublicarOfertaPage />} />
          <Route path="postulantes/:id" element={<PerfilCandidatoPage />} />
          <Route path="postulantes" element={<PostulantesPage />} />
          <Route path="entrevistas" element={<EntrevistasPage />} />
          <Route path="evaluaciones" element={<EvaluacionesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
</>));

export default function AppRoutes() { return <RouterProvider router={router} />; }
