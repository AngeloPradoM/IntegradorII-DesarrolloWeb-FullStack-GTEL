import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { useEffect, useState } from "react";
import { Video, Clock, User, ChevronLeft, ChevronRight, MapPin, Plus, X, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { getRecruiterInterviews, getRecruiterCandidates, scheduleRecruiterInterview } from "../../services/api";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function InterviewSchedule() {
  const {data, loading, error, retry} = useRecruiterData(getRecruiterInterviews);
  const interviewData = data || [];
  const now = new Date();
  const [selected, setSelected] = useState(() => new Date(now.getFullYear(),now.getMonth(),now.getDate()));
  const selectedDay = selected.getDate(), month = selected.getMonth(), year = selected.getFullYear();
  const today = month === now.getMonth() && year === now.getFullYear() ? now.getDate() : null;
  const setSelectedDay = day => setSelected(new Date(year,month,day));
  const changeMonth = amount => setSelected(new Date(year,month+amount,1));
  const firstDayOfMonth = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const monthly = interviewData.filter(item=>item.year===year && item.month===month);
  const filteredInterviews = monthly.filter(item=>item.day===selectedDay);
  const daysWithEvents = monthly.map(item=>item.day);
  const upcoming = interviewData.filter(item=>item.date && new Date(item.year,item.month,item.day)>=new Date(now.getFullYear(),now.getMonth(),now.getDate())).sort((a,b)=>a.date.localeCompare(b.date));
  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [candidatesList, setCandidatesList] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form Fields
  const [formCandidateId, setFormCandidateId] = useState("");
  const [formDate, setFormDate] = useState(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [formTime, setFormTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState(30);
  const [formType, setFormType] = useState("video");
  const [formLocation, setFormLocation] = useState("https://teams.microsoft.com/l/meetup-join/gtel-talento");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    if (showModal) {
      setLoadingCandidates(true);
      getRecruiterCandidates()
        .then(res => setCandidatesList(res || []))
        .catch(err => console.warn("Error cargando candidatos:", err))
        .finally(() => setLoadingCandidates(false));
    }
  }, [showModal]);

  const handleOpenModal = () => {
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    setFormDate(`${y}-${m}-${d}`);
    setFeedback(null);
    setShowModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formCandidateId) {
      setFeedback({ type: "error", message: "Selecciona un candidato para la entrevista." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await scheduleRecruiterInterview({
        candidateId: formCandidateId,
        date: formDate,
        time: formTime,
        durationMin: Number(formDuration),
        type: formType,
        location: formLocation,
        notes: formNotes
      });
      setFeedback({ type: "success", message: "¡Entrevista programada con éxito!" });
      setShowModal(false);
      await retry();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "No se pudo programar la entrevista." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6"><DataState loading={loading} error={error} retry={retry} />
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Agenda de Entrevistas</h1>
            <p className="text-sm text-brand-gray">{loading || error ? '—' : monthly.length} entrevistas programadas este mes</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          + Programar Entrevista
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium border ${
          feedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar — Left */}
        <div className="lg:w-80">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month header */}
            <div className="bg-brand-navy px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {MONTHS[month]} {year}
              </h3>
              <div className="flex gap-1">
                <button aria-label="Mes anterior" onClick={() => changeMonth(-1)} className="p-1 text-white/60 hover:text-white transition-colors rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button aria-label="Mes siguiente" onClick={() => changeMonth(1)} className="p-1 text-white/60 hover:text-white transition-colors rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-bold text-brand-gray py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, idx) => (
                  <div key={idx} className="flex justify-center">
                    {day ? (
                      <button
                        onClick={() => setSelectedDay(day)}
                        className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all relative ${
                          day === selectedDay
                            ? "bg-brand-red text-white"
                            : day === today
                            ? "border-2 border-brand-red text-brand-red font-bold"
                            : "text-brand-navy hover:bg-gray-100"
                        }`}
                      >
                        {day}
                        {daysWithEvents.includes(day) && day !== selectedDay && (
                          <span className="absolute bottom-0.5 w-1 h-1 bg-brand-red rounded-full" />
                        )}
                        {daysWithEvents.includes(day) && day === selectedDay && (
                          <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full" />
                        )}
                      </button>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-brand-gray">
                <div className="w-2 h-2 bg-brand-red rounded-full" />
                Con entrevistas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-gray">
                <div className="w-2 h-2 border-2 border-brand-red rounded-full" />
                Hoy
              </div>
            </div>
          </div>

          {/* Summary for selected day */}
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-xs font-bold text-brand-navy mb-2">
              {filteredInterviews.length > 0
                ? `${filteredInterviews.length} entrevistas el día ${selectedDay}`
                : `Sin entrevistas el día ${selectedDay}`}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filteredInterviews.map((i) => (
                <span key={i.id} className={`w-7 h-7 rounded-full ${i.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {i.avatar}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Interview list — Right */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-brand-navy">
              {filteredInterviews.length > 0
                ? `Entrevistas del ${selectedDay} de ${MONTHS[month]}`
                : `Sin entrevistas para el ${selectedDay} de ${MONTHS[month]}`}
            </h3>
          </div>

          {loading || error ? null : filteredInterviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-brand-gray">{interviewData.length ? "No hay entrevistas programadas para este día." : "No hay entrevistas programadas."}</p>
              <button
                onClick={handleOpenModal}
                className="mt-3 text-xs font-semibold text-brand-red hover:underline"
              >
                + Programar una entrevista
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Time badge */}
                  <div className="bg-brand-bg rounded-xl px-4 py-3 text-center min-w-[72px] border border-gray-100">
                    <div className="text-lg font-bold text-brand-navy">{interview.time}</div>
                    <div className="text-xs text-brand-gray">{interview.duration}</div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-8 h-8 ${interview.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {interview.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-navy">{interview.name}</div>
                        <div className="text-xs text-brand-gray">{interview.job}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        interview.type === "video"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-orange-50 text-orange-700"
                      }`}>
                        {interview.type === "video"
                          ? <><Video className="w-3 h-3" /> Videollamada</>
                          : interview.type === "presencial" || interview.type === "in-person" ? <><MapPin className="w-3 h-3" /> Presencial</> : <>Modalidad no disponible</>
                        }
                      </span>
                      <span className="flex items-center gap-1 text-xs text-brand-gray">
                        <Clock className="w-3 h-3" />
                        {interview.time} — {interview.duration}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {interview.type === "video" ? (
                    <button
                      onClick={() => {
                        if (interview.location && interview.location.startsWith('http')) {
                          window.open(interview.location, '_blank', 'noopener,noreferrer');
                        } else {
                          alert(`Enlace de videollamada: ${interview.location || 'Pendiente de asignación'}`);
                        }
                      }}
                      className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Unirse a Videollamada
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Ubicación presencial: ${interview.location || 'Oficinas GTEL Perú - Av. Javier Prado Este 1234'}`)}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ver ubicación
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All upcoming */}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-brand-navy mb-3">Próximas entrevistas</h4>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {!loading && !error && !upcoming.length && <p className="p-5 text-sm text-brand-gray">No hay próximas entrevistas.</p>}
              {upcoming
                .map((interview, idx, arr) => (
                  <div
                    key={interview.id}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-brand-bg transition-colors ${idx < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className={`w-8 h-8 ${interview.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {interview.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-navy truncate">{interview.name}</div>
                      <div className="text-xs text-brand-gray">{interview.job}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-brand-navy">{interview.date}</div>
                      <div className="text-xs text-brand-gray">{interview.time}</div>
                    </div>
                    <button
                      onClick={() => setSelected(new Date(interview.year,interview.month,interview.day))}
                      className="text-brand-red hover:underline text-xs font-medium"
                    >
                      Ver
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Programar Entrevista */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-base">Programar Nueva Entrevista</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleScheduleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                  Candidato <span className="text-brand-red">*</span>
                </label>
                <select
                  value={formCandidateId}
                  onChange={(e) => setFormCandidateId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white"
                >
                  <option value="">Selecciona un candidato...</option>
                  {loadingCandidates ? (
                    <option disabled>Cargando lista de candidatos...</option>
                  ) : candidatesList.length === 0 ? (
                    <option disabled>No hay candidatos disponibles</option>
                  ) : (
                    candidatesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.job || "Postulante"} {c.score ? `(${c.score}%)` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                    Fecha <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                    Hora <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                    Duración
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hr)</option>
                    <option value={90}>90 minutos (1.5 hr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                    Modalidad
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      setFormType(e.target.value);
                      if (e.target.value === "video" && !formLocation) {
                        setFormLocation("https://teams.microsoft.com/l/meetup-join/gtel-talento");
                      } else if (e.target.value === "presencial" && formLocation.startsWith("http")) {
                        setFormLocation("Av. Javier Prado Este 1234, San Isidro - Sala 3B");
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white"
                  >
                    <option value="video">Videollamada</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                  {formType === "video" ? "Enlace de Videollamada (Teams / Meet)" : "Dirección / Sala de Entrevista"}
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder={formType === "video" ? "https://teams.microsoft.com/..." : "Oficinas centrales GTEL, Piso 4"}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">
                  Notas / Temario para el Entrevistador
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Temas a profundizar, caso práctico o instrucciones al candidato..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-brand-gray hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-brand-red hover:bg-brand-red-hover text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Programando..." : "Confirmar y Programar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewSchedule;


