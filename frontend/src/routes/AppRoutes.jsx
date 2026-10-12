import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PublicLayout from "../layouts/PublicLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const JobTrash = lazy(() => import('../pages/reclutador/JobTrash'));
const RecoveryPage = lazy(() => import('../pages/auth/RecoveryPage'));
const AuditPage = lazy(() => import('../pages/admin/AuditPage'));
const NotificationsPage = lazy(() => import('../pages/candidato/NotificationsPage'));
const SelectionWorkspace = lazy(() => import('../pages/reclutador/SelectionWorkspace'));
const JobEditor = lazy(() => import('../pages/reclutador/JobEditor'));
const AdminUsersPage = lazy(() => import('../pages/admin/UsersPage'));
const LoginModalRedirect = lazy(() => import('../pages/auth/LoginModalRedirect'));
const LandingPage = lazy(() => import('../pages/candidato/LandingPage'));
const OfertasLaboralesPage = lazy(() => import('../pages/candidato/OfertasLaboralesPage'));
const FormularioPostulacionPage = lazy(() => import('../pages/candidato/FormularioPostulacionPage'));
const MisPostulacionesPage = lazy(() => import('../pages/candidato/MisPostulacionesPage'));
const OfertaDetallePage = lazy(() => import('../pages/candidato/OfertaDetallePage'));
const PerfilPage = lazy(() => import('../pages/candidato/PerfilPage'));
const ContactarReclutadorPage = lazy(() => import('../pages/candidato/ContactarReclutadorPage'));
const PerfilCandidatoPage = lazy(() => import('../pages/reclutador/PerfilCandidatoPage'));
const DashboardPage = lazy(() => import('../pages/reclutador/DashboardPage'));
const PublicarOfertaPage = lazy(() => import('../pages/reclutador/PublicarOfertaPage'));
const PostulantesPage = lazy(() => import('../pages/reclutador/PostulantesPage'));
const EntrevistasPage = lazy(() => import('../pages/reclutador/EntrevistasPage'));
const EvaluacionesPage = lazy(() => import('../pages/reclutador/EvaluacionesPage'));
const RecruiterJobs = lazy(() => import('../pages/reclutador/OfertasPage'));
const RecruiterJobDetail = lazy(() => import('../pages/reclutador/OfertasPage').then(module => ({ default: module.RecruiterJobDetail })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

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

export default function AppRoutes() {
  return <Suspense fallback={<main aria-busy="true" aria-live="polite">Cargando...</main>}><RouterProvider router={router} /></Suspense>;
}
