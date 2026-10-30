import { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function SupportDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("gtel-user") || "{}")?.token;
    const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL 
        ? import.meta.env.VITE_API_URL 
        : "http://localhost:8080").replace(/\/$/, "");

    fetch(`${apiBase}/api/support/tickets/dashboard`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando dashboard de soporte:", err);
        setLoading(false);
      });
  }, []);

  const getSlaBadge = (status) => {
    switch (status) {
      case 'CUMPLIDO': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'A TIEMPO': return "bg-green-100 text-green-700 border-green-200";
      case 'POR VENCER': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'VENCIDO': return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getSlaIcon = (status) => {
    if (status === 'VENCIDO') return <AlertCircle className="w-3.5 h-3.5" />;
    if (status === 'CUMPLIDO') return <CheckCircle className="w-3.5 h-3.5" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-slate-100">Tablero de Solicitudes de Servicio</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5">Seguimiento de Acuerdos de Nivel de Servicio (SLA)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Código / Solicitud</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Prioridad</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Responsable</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Estado Actual</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Cumplimiento SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">Cargando solicitudes...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No hay solicitudes registradas.</td></tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-[#1E293B]">{ticket.code}</div>
                      <div className="text-xs text-slate-500">{ticket.title}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 font-medium">{ticket.priority}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{ticket.assignedTo}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold ${getSlaBadge(ticket.slaStatus)}`}>
                        {getSlaIcon(ticket.slaStatus)}
                        {ticket.slaStatus}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}