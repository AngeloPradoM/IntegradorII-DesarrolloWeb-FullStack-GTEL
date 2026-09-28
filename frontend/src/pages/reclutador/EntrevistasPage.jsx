import useRecruiterData from "../../hooks/useRecruiterData";
import DataState from "../../components/ui/DataState";
import { useState } from "react";
import { Video, Clock, User, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getRecruiterInterviews } from "../../services/api";

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

  return (
    <div className="p-6"><DataState loading={loading} error={error} retry={retry} />
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Agenda de Entrevistas</h1>
            <p className="text-sm text-brand-gray">{loading || error ? '—' : monthly.length} entrevistas programadas este mes</p>
        </div>
        <button disabled title="Programación pendiente de integración" className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Programar Entrevista
        </button>
      </div>

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
              <button disabled title="Programación pendiente de integración" className="mt-3 text-xs font-medium text-brand-red hover:underline">
                Programar una entrevista
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
                    <button disabled title="Acción pendiente de integración" className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 shadow-sm">
                      <Video className="w-3.5 h-3.5" />
                      Unirse a Videollamada
                    </button>
                  ) : (
                    <button disabled title="Acción pendiente de integración" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0">
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
    </div>
  );
}

export default InterviewSchedule;


