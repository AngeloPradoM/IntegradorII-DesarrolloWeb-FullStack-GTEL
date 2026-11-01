import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecruiterCandidate, updateCandidateStatus, getCandidateTimeline } from "../../services/api";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Calendar, Download, CheckCircle, XCircle, MessageSquare, ArrowLeft, Briefcase, GraduationCap, Star, FileText, Globe, Clock, History, ShieldAlert, Lock, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * RFC-2026-0002 · Descarga individual de CV con acceso restringido
 *
 * - Solo roles Administrador o Analista de RR.HH. ven el botón.
 * - Antes de descargar se pide confirmar que existe autorización previa
 *   (la persona que autoriza no puede ser el mismo usuario).
 * - Cada descarga queda registrada en auditoría.
 *
 * SIMULADO por ahora: se genera un PDF de prueba llamado "cv.pdf" en el
 * navegador y la auditoría se guarda solo en memoria. Para integrar el
 * backend: poner SIMULATE_CV_DOWNLOAD = false (usa downloadCvFromApi) y
 * reemplazar registerCvAudit por la llamada real al endpoint de auditoría.
 * ------------------------------------------------------------------ */
const SIMULATE_CV_DOWNLOAD = true;
const SIMULATED_CV_FILENAME = "cv.pdf";

// Roles autorizados (se normalizan: sin tildes, minúsculas, sin prefijo ROLE_).
// TODO: ajustar a los valores reales que devuelve el backend.
const AUTHORIZED_ROLES = ["admin", "administrador", "analista", "analistarrhh", "analistaderrhh", "reclutador", "rrhh"];

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeRole = (role) => normalizeText(role).replace(/^role_/, "").replace(/[^a-z]/g, "");

const getSessionUser = () => {
  try {
    return JSON.parse(localStorage.getItem("gtel-user") || "{}") || {};
  } catch {
    return {};
  }
};

const getSessionRole = (user) => {
  const raw = user.role ?? user.rol ?? user.user?.role ?? user.user?.rol ?? (Array.isArray(user.roles) ? user.roles[0] : undefined);
  return typeof raw === "object" && raw !== null ? raw.name ?? raw.nombre : raw;
};

const isAuthorizedRole = (role) => {
  // Si el rol aún no viene en la sesión, en modo simulado se permite para poder probar.
  if (!role) return SIMULATE_CV_DOWNLOAD;
  return AUTHORIZED_ROLES.includes(normalizeRole(role));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Genera un PDF mínimo y válido de una página (solo para la simulación).
const buildSimulatedCvPdf = (candidateName) => {
  const clean = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[\\()]/g, (m) => `\\${m}`);

  const stream =
    "BT /F1 22 Tf 72 760 Td (CV - DOCUMENTO SIMULADO) Tj " +
    `/F1 14 Tf 0 -36 Td (${clean(candidateName)}) Tj ` +
    "/F1 11 Tf 0 -24 Td (Archivo de prueba generado para la RFC-2026-0002.) Tj " +
    `0 -18 Td (Generado: ${clean(new Date().toLocaleString("es-PE"))}) Tj ET`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

const triggerBlobDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

// Descarga real contra el API (se usa cuando SIMULATE_CV_DOWNLOAD = false).
// El backend debe validar JWT + rol en cada petición y registrar en auditoría.
const downloadCvFromApi = async (candidate) => {
  const token = getSessionUser()?.token;
  if (!token) throw new Error("Sesión no válida (401). Inicia sesión nuevamente.");
  const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : "http://localhost:8080").replace(/\/$/, "");
  const url = candidate.cvUrl.startsWith("http") ? candidate.cvUrl : apiBase + candidate.cvUrl;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error("Sesión no válida (401). Inicia sesión nuevamente.");
  if (res.status === 403) throw new Error("No tienes permiso para descargar este CV (403).");
  if (!res.ok) throw new Error("No se pudo descargar el archivo.");
  triggerBlobDownload(await res.blob(), `${candidate.name.replace(/\s+/g, "_")}_CV.pdf`);
};

export default function CandidateProfile() {
  const {
    id
  } = useParams();
  const load = useCallback(() => getRecruiterCandidate(id), [id]);
  const {data:candidate, loading, error:loadError, retry} = useRecruiterData(load);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // --- Descarga de CV (RFC-2026-0002) ---
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [showCvConfirm, setShowCvConfirm] = useState(false);
  const [authorizedBy, setAuthorizedBy] = useState("");
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [cvAudit, setCvAudit] = useState([]); // auditoría simulada (solo en memoria)
  const topRef = useRef(null);

 const sessionUser = useMemo(() => getSessionUser(), []);
  const sessionRole = getSessionRole(sessionUser);
  const canDownloadCv = isAuthorizedRole(sessionRole);
  const currentUserName = sessionUser.name ?? sessionUser.nombre ?? sessionUser.user?.name ?? "";
  const currentUserEmail = sessionUser.email ?? sessionUser.user?.email ?? "";
  const currentUserLabel = currentUserName || currentUserEmail || "Usuario actual";

  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    setLoadingTimeline(true);
    try {
      const data = await getCandidateTimeline(id);
      if (Array.isArray(data)) {
        setTimeline(data);
      }
    } catch (timelineError) {
      console.warn("No se pudo cargar la línea de tiempo:", timelineError);
    } finally {
      setLoadingTimeline(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Los avisos van en la parte superior: al aparecer uno, se lleva la vista hasta él.
  useEffect(() => {
    if ((notice || error) && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [notice, error]);

  // Cerrar el modal con Escape.
  useEffect(() => {
    if (!showCvConfirm) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setShowCvConfirm(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCvConfirm]);

  const changeStatus = async status => {
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await updateCandidateStatus(id, status);
      retry();
      await fetchTimeline();
      setNotice(status === "aprobada" ? "Candidato aprobado correctamente." : status === "entrevista" ? "Candidato movido a entrevista." : "Candidato descartado.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  // Auditoría SIMULADA. TODO: reemplazar por el registro real en la tabla `auditoria`.
  const registerCvAudit = ({ authorizedBy: approver }) => {
    const entry = {
      id: `${Date.now()}`,
      date: new Date().toLocaleString("es-PE"),
      user: currentUserLabel,
      role: sessionRole || "Sin rol (simulado)",
      authorizedBy: approver,
      file: SIMULATED_CV_FILENAME
    };
    setCvAudit(prev => [entry, ...prev]);
    return entry;
  };

  const openCvConfirm = () => {
    setAuthorizedBy("");
    setAuthConfirmed(false);
    setConfirmError("");
    setShowCvConfirm(true);
  };

  const confirmCvDownload = async (event) => {
    event.preventDefault();
    const approver = authorizedBy.trim();
    if (approver.length < 3) {
      setConfirmError("Indica el nombre de la persona que autorizó la descarga.");
      return;
    }
    const approverKey = normalizeText(approver);
    const isSelf = [currentUserName, currentUserEmail].some(v => v && normalizeText(v) === approverKey);
    if (isSelf) {
      setConfirmError("No puedes autorizarte a ti mismo. La autorización debe venir de otra persona.");
      return;
    }
    if (!authConfirmed) {
      setConfirmError("Confirma que cuentas con la autorización previa.");
      return;
    }
    setShowCvConfirm(false);
    await downloadCv(approver);
  };

  const downloadCv = async (approver) => {
    if (!candidate || downloadingCv) return;
    setDownloadingCv(true); setError(""); setNotice("");
    try {
      if (SIMULATE_CV_DOWNLOAD) {
        await sleep(600); // simula la respuesta del servidor
        triggerBlobDownload(buildSimulatedCvPdf(candidate.name), SIMULATED_CV_FILENAME);
      } else {
        if (!candidate.cvUrl) throw new Error("El candidato no tiene CV adjunto.");
        await downloadCvFromApi(candidate);
      }
      registerCvAudit({ authorizedBy: approver });
      setNotice(`CV descargado${SIMULATE_CV_DOWNLOAD ? " " : ""}: ${SIMULATE_CV_DOWNLOAD ? SIMULATED_CV_FILENAME : "archivo del candidato"}. Autorizado por ${approver}. La descarga quedó registrada en auditoría.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingCv(false);
    }
  };

  if (loading || loadError || !candidate) return <div className="p-6"><Link to="/reclutador/postulantes" className="text-sm text-brand-red">Volver al directorio</Link><DataState loading={loading} error={loadError} retry={retry} empty={!candidate} emptyMessage="No se encontró el candidato solicitado." /></div>;

  const experience = candidate.experience || [];
  const education = candidate.education || [];
  const skills = candidate.skills || [];
  const languages = candidate.languages || [];
  const certifications = candidate.certifications || [];

  return <div className="p-6">
      <div ref={topRef} className="scroll-mt-4">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      </div>
      {/* Back */}
      <Link to="/reclutador/postulantes" className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1E293B] mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al directorio
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-[#1E293B] to-[#334155]" />
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-8">
            <div className="w-16 h-16 bg-[#D32F2F] rounded-2xl flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-md flex-shrink-0">
              {candidate.name.split(" ").map(part => part[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h1 className="text-lg font-bold text-[#1E293B]">{candidate.name}</h1>
                  <p className="text-sm text-[#475569]">{candidate.job}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={saving} onClick={() => changeStatus("aprobada")} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button disabled={saving} onClick={() => changeStatus("entrevista")} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Entrevista
                  </button>
                  <button disabled={saving} onClick={() => changeStatus("rechazada")} className="flex items-center gap-1.5 px-4 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    <XCircle className="w-3.5 h-3.5" />
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Center - CV Content (large) */}
        <div className="flex-[2] space-y-5">
          {/* Experience */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="font-bold text-[#1E293B]">Experiencia Profesional</h2>
            </div>
            <div className="space-y-5">
              {!experience.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{experience.map((exp, i) => <div key={`${exp.company}-${i}`} className="relative pl-4 border-l-2 border-[#D32F2F]/30">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-[#D32F2F] rounded-full" />
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-sm font-bold text-[#1E293B]">{exp.role}</div>
                      <div className="text-xs font-medium text-[#D32F2F]">{exp.company}</div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-[#475569] bg-gray-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">{exp.desc}</p>
                </div>)}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="font-bold text-[#1E293B]">Educación</h2>
            </div>
            {!education.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{education.map((edu, i) => <div key={`${edu.institution}-${i}`} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E293B]">{edu.degree}</div>
                  <div className="text-xs text-[#475569]">{edu.institution}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#475569]">{edu.period}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{edu.status}</span>
                  </div>
                </div>
              </div>)}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="font-bold text-[#1E293B]">Habilidades</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {!skills.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{skills.map(skill => <span key={skill} className="px-3 py-1 bg-[#F8FAFC] border border-gray-200 text-xs text-[#1E293B] rounded-full font-medium">
                  {skill}
                </span>)}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="font-bold text-[#1E293B]">Idiomas</h2>
            </div>
            <div className="space-y-3">
              {!languages.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{languages.map(l => <div key={l.lang}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#1E293B]">{l.lang}</span>
                    <span className="text-[#475569]">{l.level}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D32F2F] rounded-full" style={{
                  width: `${l.score ?? 0}%`
                }} />
                  </div>
                </div>)}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="font-bold text-[#1E293B]">Certificaciones</h2>
            </div>
            <ul className="space-y-2">
              {!certifications.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{certifications.map(cert => <li key={cert} className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  {cert}
                </li>)}
            </ul>
          </div>

          {/* Historial del Proceso y Auditoría (Timeline) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#D32F2F]" />
                <h2 className="font-bold text-[#1E293B]">Historial del Proceso y Auditoría</h2>
              </div>
              <span className="text-xs text-[#475569] bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {timeline.length} {timeline.length === 1 ? "hito" : "hitos"}
              </span>
            </div>

            {loadingTimeline && (
              <p className="text-xs text-[#64748B] py-3">Cargando historial del proceso...</p>
            )}

            {!loadingTimeline && !timeline.length && (
              <p className="text-xs text-[#64748B] py-3">Sin historial de cambios registrado para este postulante.</p>
            )}

            {!loadingTimeline && timeline.length > 0 && (
              <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((item, idx) => {
                  const stageBadge = {
                    recibida: "bg-slate-100 text-slate-700 border-slate-200",
                    en_revision: "bg-amber-100 text-amber-800 border-amber-200",
                    entrevista: "bg-blue-100 text-blue-800 border-blue-200",
                    aprobada: "bg-green-100 text-green-800 border-green-200",
                    rechazada: "bg-red-100 text-red-800 border-red-200"
                  }[item.newStatus] || "bg-gray-100 text-gray-700 border-gray-200";

                  const stageLabel = {
                    recibida: "Recibida",
                    en_revision: "En Revisión",
                    entrevista: "Entrevista",
                    aprobada: "Aprobado",
                    rechazada: "Descartado"
                  }[item.newStatus] || item.newStatus;

                  return (
                    <div key={item.id || idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#D32F2F] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                      </div>

                      <div className="bg-[#F8FAFC] border border-gray-200/70 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageBadge}`}>
                              {stageLabel}
                            </span>
                            {item.previousStatus && (
                              <span className="text-[10px] text-gray-400">
                                (desde: {item.previousStatus})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#64748B] font-medium">
                            {item.date}
                          </span>
                        </div>

                        {item.comment && (
                          <p className="text-xs text-[#334155] leading-relaxed">
                            {item.comment}
                          </p>
                        )}

                        <div className="text-[10px] text-gray-400">
                          Registrado por: <span className="text-gray-600 font-medium">{item.userEmail || "Sistema"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Auditoría de descargas de CV (simulada en memoria) */}
            {cvAudit.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-[#1E293B] mb-3">
                  Descargas de CV registradas
                  <span className="ml-2 font-medium text-[#64748B]">(simulado, solo en esta sesión)</span>
                </h3>
                <ul className="space-y-2">
                  {cvAudit.map(entry => (
                    <li key={entry.id} className="bg-[#F8FAFC] border border-gray-200/70 rounded-xl p-3 text-xs text-[#334155] space-y-0.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">Descarga de {entry.file}</span>
                        <span className="text-[11px] text-[#64748B]">{entry.date}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Descargado por <span className="font-medium text-gray-700">{entry.user}</span> ({entry.role}) · Autorizado por <span className="font-medium text-gray-700">{entry.authorizedBy}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — contact & actions */}
        <div className="lg:w-72 space-y-5">
          {/* Score card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-3">Puntuación ATS</h3>
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={candidate.score >= 85 ? "#22c55e" : candidate.score >= 70 ? "#f59e0b" : "#D32F2F"} strokeWidth="8" strokeDasharray={`${(candidate.score ?? 0) / 100 * 201} 201`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#1E293B]">{candidate.score ?? 'N/D'}</span>
                  <span className="text-[10px] text-[#475569]">/100</span>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-brand-gray">{candidate.score == null ? "Sin puntuación disponible" : "Puntuación recibida"}</div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-3">Datos de contacto</h3>
            <div className="space-y-3">
              {[{
              icon: Mail,
              value: candidate.email
            }, {
              icon: Phone,
              value: candidate.phone
            }, {
              icon: MapPin,
              value: candidate.location
            }, {
              icon: Calendar,
              value: `Postulado: ${candidate.appliedDate}`
            }, {
              icon: FileText,
              value: `DNI: ${candidate.dni}`
            }].map(({
              icon: Icon,
              value
            }) => <div key={value} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-[#F8FAFC] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#D32F2F]" />
                  </div>
                  <span className="text-xs text-[#475569] break-all">{value}</span>
                </div>)}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-1">Acciones</h3>
            <button disabled={saving} onClick={() => changeStatus("aprobada")} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <CheckCircle className="w-3.5 h-3.5" />
              Aprobar candidato
            </button>
            <button disabled={saving} onClick={() => changeStatus("entrevista")} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <MessageSquare className="w-3.5 h-3.5" />
              Programar entrevista
            </button>

            {/* Descarga de CV: solo para roles autorizados (RFC-2026-0002) */}
            {canDownloadCv ? (
              <div>
                <button
                  type="button"
                  disabled={downloadingCv}
                  onClick={openCvConfirm}
                  title="Requiere autorización previa. La descarga queda registrada en auditoría."
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg text-xs font-medium text-[#1E293B] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingCv ? "Descargando CV..." : "Descargar CV"}
                </button>
                <p className="mt-1.5 text-[10px] text-[#64748B] leading-snug">
                  Requiere autorización previa. Cada descarga queda registrada en auditoría.
                </p>
              </div>
            ) : (
              <p className="flex items-start gap-1.5 text-[10px] text-[#64748B] leading-snug border border-dashed border-gray-200 rounded-lg p-2.5">
                <Lock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                La descarga de CV está disponible solo para Administrador y Analista de RR.HH.
              </p>
            )}

            <button disabled={saving} onClick={() => changeStatus("rechazada")} className="w-full flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <XCircle className="w-3.5 h-3.5" />
              Descartar candidato
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide mb-3">Notas del reclutador</h3>
            <textarea rows={4} placeholder="Agrega observaciones sobre este candidato..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] resize-none" />
            <button disabled title="Esta acción todavía no está disponible" className="mt-2 w-full bg-[#F8FAFC] hover:bg-gray-100 text-[#475569] py-2 rounded-lg text-xs font-medium transition-colors border border-gray-200">
              Guardar nota
            </button>
          </div>
        </div>
      </div>

      {/* Recordatorio de autorización previa antes de descargar el CV */}
      {showCvConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCvConfirm(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-confirm-title"
            onClick={e => e.stopPropagation()}
            onSubmit={confirmCvDownload}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 id="cv-confirm-title" className="text-base font-bold text-[#1E293B]">Autorización previa requerida</h2>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    El CV contiene datos personales de <span className="font-semibold">{candidate.name}</span>. Descárgalo solo si otra persona con facultades ya autorizó el acceso. No puedes autorizarte a ti mismo. La descarga quedará registrada en auditoría a tu nombre.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCvConfirm(false)}
                aria-label="Cerrar"
                className="p-1 rounded-lg text-[#64748B] hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label htmlFor="cv-authorized-by" className="block text-xs font-semibold text-[#475569] mb-1.5">
              Persona que autorizó la descarga
            </label>
            <input
              id="cv-authorized-by"
              autoFocus
              value={authorizedBy}
              onChange={e => { setAuthorizedBy(e.target.value); setConfirmError(""); }}
              type="text"
              placeholder="Nombre o correo de quien autoriza"
              className="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
            />

            <label className="mt-4 flex items-start gap-2.5 text-xs text-[#334155] cursor-pointer">
              <input
                type="checkbox"
                checked={authConfirmed}
                onChange={e => { setAuthConfirmed(e.target.checked); setConfirmError(""); }}
                className="mt-0.5 accent-[#D32F2F]"
              />
              <span>Confirmo que cuento con autorización previa para descargar este CV y que usaré los datos solo para el proceso de selección.</span>
            </label>

            {confirmError && (
              <p role="alert" className="mt-3 text-xs text-[#D32F2F]">{confirmError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCvConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-[#475569] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Confirmar y descargar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>;
}
