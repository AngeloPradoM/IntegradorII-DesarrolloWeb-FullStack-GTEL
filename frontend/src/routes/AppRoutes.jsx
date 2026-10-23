import AdminUsersPage from "../pages/admin/UsersPage";
import AuditPage from "../pages/admin/AuditPage";
import LoginModalRedirect from "../pages/auth/LoginModalRedirect";
import RecoveryPage from "../pages/auth/RecoveryPage";
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
import NotificationsPage from "../pages/candidato/NotificationsPage";
import PerfilCandidatoPage from "../pages/reclutador/PerfilCandidatoPage";
import DashboardPage from "../pages/reclutador/DashboardPage";
import PublicarOfertaPage from "../pages/reclutador/PublicarOfertaPage";
import PostulantesPage from "../pages/reclutador/PostulantesPage";
import EntrevistasPage from "../pages/reclutador/EntrevistasPage";
import EvaluacionesPage from "../pages/reclutador/EvaluacionesPage";
import RecruiterJobs, { RecruiterJobDetail } from "../pages/reclutador/OfertasPage";
import JobTrash from "../pages/reclutador/JobTrash";
import JobEditor from "../pages/reclutador/JobEditor";
import SelectionWorkspace from "../pages/reclutador/SelectionWorkspace";
import RequerimientosPage from "../pages/reclutador/RequerimientosPage";
import RecruiterTicketsPage from "../pages/support/RecruiterTicketsPage";
import TechnicianTicketsPage from "../pages/support/TechnicianTicketsPage";
import AdminTicketsPage from "../pages/support/AdminTicketsPage";
import SystemGuidePage from "../pages/reclutador/SystemGuidePage";
import TechnicianLayout from "../layouts/TechnicianLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import NotFoundPage from "../pages/NotFoundPage";

const router = createBrowserRouter(createRoutesFromElements(<>
        <Route path="/login" element={<LoginModalRedirect />} />
        <Route path="/recuperar-acceso" element={<RecoveryPage />} />

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/auditoria" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditPage /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminTicketsPage /></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute allowedRoles={["CANDIDATO", "RECLUTADOR", "ADMIN", "JEFATURA_SOLICITANTE", "ANALISTA_RRHH", "ENTREVISTADOR", "TECNICO"]}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/ofertas" element={<OfertasLaboralesPage />} />
          <Route path="/ofertas/:id" element={<OfertaDetallePage />} />
          <Route path="/postulacion" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><FormularioPostulacionPage /></ProtectedRoute>} />
          <Route path="/postulacion/:id" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><FormularioPostulacionPage /></ProtectedRoute>} />
          <Route path="/contactar-reclutador" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><ContactarReclutadorPage /></ProtectedRoute>} />
          <Route path="/mis-postulaciones" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><MisPostulacionesPage /></ProtectedRoute>} />
          <Route path="/candidato" element={<ProtectedRoute allowedRoles={["CANDIDATO"]}><MisPostulacionesPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute allowedRoles={["CANDIDATO", "RECLUTADOR", "ADMIN", "JEFATURA_SOLICITANTE", "ANALISTA_RRHH", "ENTREVISTADOR", "TECNICO"]}><PerfilPage /></ProtectedRoute>} />
        </Route>

        <Route path="/reclutador" element={<ProtectedRoute allowedRoles={["RECLUTADOR", "ADMIN", "JEFATURA_SOLICITANTE", "ANALISTA_RRHH", "ENTREVISTADOR"]}><RecruiterLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="requerimientos" element={<RequerimientosPage />} />
          <Route path="ofertas" element={<RecruiterJobs />} />
          <Route path="ofertas/papelera" element={<JobTrash />} />
          <Route path="ofertas/:id/editar" element={<JobEditor />} />
          <Route path="ofertas/:id" element={<RecruiterJobDetail />} />
          <Route path="publicar-oferta" element={<PublicarOfertaPage />} />
          <Route path="postulantes/:id" element={<PerfilCandidatoPage />} />
          <Route path="postulantes" element={<PostulantesPage />} />
          <Route path="entrevistas" element={<EntrevistasPage />} />
          <Route path="evaluaciones" element={<EvaluacionesPage />} />
          <Route path="seleccion" element={<SelectionWorkspace />} />
          <Route path="tickets" element={<RecruiterTicketsPage />} />
          <Route path="guia-uso" element={<SystemGuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/tecnico" element={<ProtectedRoute allowedRoles={["TECNICO"]}><TechnicianLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="tickets" replace />} />
          <Route path="tickets" element={<TechnicianTicketsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
</>));

export default function AppRoutes() { return <RouterProvider router={router} />; }
