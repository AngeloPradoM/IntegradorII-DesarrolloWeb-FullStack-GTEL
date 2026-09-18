import { useState } from "react";
import { Video, Clock, User, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const interviews = [
  {
    id: 1,
    name: "María López Herrera",
    job: "Supervisor Call Center",
    time: "09:00",
    duration: "45 min",
    type: "video",
    day: 19,
    avatar: "ML",
    color: "bg-blue-600",
  },
  {
    id: 2,
    name: "Claudia Mamani Rios",
    job: "Agente Bilingüe",
    time: "10:30",
    duration: "30 min",
    type: "video",
    day: 19,
    avatar: "CM",
    color: "bg-purple-600",
  },
  {
    id: 3,
    name: "Carlos Rodríguez",
    job: "Agente de Ventas",
    time: "12:00",
    duration: "30 min",
    type: "presential",
    day: 19,
    avatar: "CR",
    color: "bg-[#D32F2F]",
  },
  {
    id: 4,
    name: "Fernando García",
    job: "Soporte Técnico",
    time: "15:00",
    duration: "45 min",
    type: "video",
    day: 21,
    avatar: "FG",
    color: "bg-green-600",
  },
  {
    id: 5,
    name: "Ana Torres Mendoza",
    job: "Agente Bilingüe",
    time: "16:30",
    duration: "30 min",
    type: "video",
    day: 22,
    avatar: "AT",
    color: "bg-teal-600",
  },
];

const daysWithEvents = [19, 21, 22];

export function InterviewSchedule() {
  const [selectedDay, setSelectedDay] = useState(19);
  const today = 19;
  const year = 2026;
  const month = 4; // May (0-indexed)

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredInterviews = interviews.filter((i) => i.day === selectedDay);

  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Agenda de Entrevistas</h1>
          <p className="text-sm text-[#475569]">{interviews.length} entrevistas programadas este mes</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Programar Entrevista
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar — Left */}
        <div className="lg:w-80">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month header */}
            <div className="bg-[#1E293B] px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {MONTHS[month]} {year}
              </h3>
              <div className="flex gap-1">
                <button className="p-1 text-white/60 hover:text-white transition-colors rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 text-white/60 hover:text-white transition-colors rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-[#475569] py-1">
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
                            ? "bg-[#D32F2F] text-white"
                            : day === today
                            ? "border-2 border-[#D32F2F] text-[#D32F2F] font-bold"
                            : "text-[#1E293B] hover:bg-gray-100"
                        }`}
                      >
                        {day}
                        {daysWithEvents.includes(day) && day !== selectedDay && (
                          <span className="absolute bottom-0.5 w-1 h-1 bg-[#D32F2F] rounded-full" />
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
              <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
                <div className="w-2 h-2 bg-[#D32F2F] rounded-full" />
                Con entrevistas
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
                <div className="w-2 h-2 border-2 border-[#D32F2F] rounded-full" />
                Hoy
              </div>
            </div>
          </div>

          {/* Summary for selected day */}
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-xs font-bold text-[#1E293B] mb-2">
              {filteredInterviews.length > 0
                ? `${filteredInterviews.length} entrevistas el día ${selectedDay}`
                : `Sin entrevistas el día ${selectedDay}`}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {filteredInterviews.map((i) => (
                <span key={i.id} className={`w-7 h-7 rounded-full ${i.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {i.avatar}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Interview list — Right */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1E293B]">
              {filteredInterviews.length > 0
                ? `Entrevistas del ${selectedDay} de ${MONTHS[month]}`
                : `Sin entrevistas para el ${selectedDay} de ${MONTHS[month]}`}
            </h3>
          </div>

          {filteredInterviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-[#475569]">No hay entrevistas programadas para este día</p>
              <button className="mt-3 text-xs font-medium text-[#D32F2F] hover:underline">
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
                  <div className="bg-[#F8FAFC] rounded-xl px-4 py-3 text-center min-w-[72px] border border-gray-100">
                    <div className="text-lg font-bold text-[#1E293B]">{interview.time}</div>
                    <div className="text-[10px] text-[#475569]">{interview.duration}</div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-8 h-8 ${interview.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {interview.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1E293B]">{interview.name}</div>
                        <div className="text-xs text-[#475569]">{interview.job}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        interview.type === "video"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-orange-50 text-orange-700"
                      }`}>
                        {interview.type === "video"
                          ? <><Video className="w-3 h-3" /> Videollamada</>
                          : <><MapPin className="w-3 h-3" /> Presencial</>
                        }
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-[#475569]">
                        <Clock className="w-3 h-3" />
                        {interview.time} — {interview.duration}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {interview.type === "video" ? (
                    <button className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 shadow-sm">
                      <Video className="w-3.5 h-3.5" />
                      Unirse a Videollamada
                    </button>
                  ) : (
                    <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0">
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
            <h4 className="text-sm font-bold text-[#1E293B] mb-3">Próximas entrevistas</h4>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {interviews
                .filter((i) => i.day > today)
                .sort((a, b) => a.day - b.day)
                .map((interview, idx, arr) => (
                  <div
                    key={interview.id}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors ${idx < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className={`w-8 h-8 ${interview.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {interview.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1E293B] truncate">{interview.name}</div>
                      <div className="text-xs text-[#475569]">{interview.job}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-[#1E293B]">{interview.day} Mayo</div>
                      <div className="text-[10px] text-[#475569]">{interview.time}</div>
                    </div>
                    <button
                      onClick={() => setSelectedDay(interview.day)}
                      className="text-[#D32F2F] hover:underline text-[10px] font-medium"
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


