import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecruiterCandidate, updateCandidateStatus, getCandidateTimeline } from "../../services/api";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Calendar, Download, CheckCircle, XCircle, MessageSquare, ArrowLeft, Briefcase, GraduationCap, Star, FileText, Globe, Clock, History } from "lucide-react";
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

  const changeStatus = async status => {
    if (saving) return;
    setSaving(true); setError("");
    try {
      await updateCandidateStatus(id, status);
      retry();
      await fetchTimeline();
      setNotice(status === "aprobada" ? "Candidato aprobado correctamente." : status === "entrevista" ? "Candidato movido a entrevista." : "Candidato descartado.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const [downloadingCv, setDownloadingCv] = useState(false);
  const downloadCv = async () => {
    if (!candidate?.cvUrl) return;
    setDownloadingCv(true); setError("");
    try {
      const token = JSON.parse(localStorage.getItem('gtel-user') || '{}')?.token;
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080').replace(/\/$/, '');
      const url = candidate.cvUrl.startsWith('http') ? candidate.cvUrl : apiBase + candidate.cvUrl;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${candidate.name.replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingCv(false);
    }
  };
  if (loading || loadError || !candidate) return <div className="p-6"><Link to="/reclutador/postulantes" className="text-sm text-brand-red">Volver al directorio</Link><DataState loading={loading} error={loadError} retry={retry} empty={!candidate} emptyMessage="No se encontró el candidato solicitado." /></div>;
  return <div className="p-6">
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
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
                  <button disabled={saving} onClick={() => changeStatus("aprobada")} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button disabled={saving} onClick={() => changeStatus("entrevista")} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Entrevista
                  </button>
                  <button disabled={saving} onClick={() => changeStatus("rechazada")} className="flex items-center gap-1.5 px-4 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
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
              {!candidate.experience.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{candidate.experience.map(exp => <div key={exp.company} className="relative pl-4 border-l-2 border-[#D32F2F]/30">
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
            {!candidate.education.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{candidate.education.map(edu => <div key={edu.institution} className="flex items-start gap-3">
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
              {!candidate.skills.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{candidate.skills.map(skill => <span key={skill} className="px-3 py-1 bg-[#F8FAFC] border border-gray-200 text-xs text-[#1E293B] rounded-full font-medium">
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
              {!candidate.languages.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{candidate.languages.map(l => <div key={l.lang}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#1E293B]">{l.lang}</span>
                    <span className="text-[#475569]">{l.level}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D32F2F] rounded-full" style={{
                  width: `${l.score == null ? "N/D" : `${l.score}%`}`
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
              {!candidate.certifications.length && <p className="text-xs text-brand-gray">Sin información disponible.</p>}{candidate.certifications.map(cert => <li key={cert} className="flex items-center gap-2 text-xs text-[#475569]">
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
            <button disabled={saving} onClick={() => changeStatus("aprobada")} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors">
              <CheckCircle className="w-3.5 h-3.5" />
              Aprobar candidato
            </button>
            <button disabled={saving} onClick={() => changeStatus("entrevista")} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              Programar entrevista
            </button>
            <button
              type="button"
              disabled={!candidate.cvUrl || downloadingCv}
              onClick={downloadCv}
              title={candidate.cvUrl ? "Descargar currículum vitae del candidato" : "El candidato no tiene CV adjunto"}
              className={`w-full flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                candidate.cvUrl ? "text-[#1E293B] hover:bg-gray-50 cursor-pointer" : "text-gray-400 bg-gray-50 cursor-not-allowed"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingCv ? "Descargando CV..." : candidate.cvUrl ? "Descargar CV Adjunto" : "Sin CV adjunto"}
            </button>
            <button disabled={saving} onClick={() => changeStatus("rechazada")} className="w-full flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-2.5 rounded-lg text-xs font-bold transition-colors">
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
    </div>;
}
