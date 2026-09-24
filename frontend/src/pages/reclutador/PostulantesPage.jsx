import { useEffect } from "react";
import { getRecruiterCandidates } from "../../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Download, Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
const statusConfig = {
  new: {
    label: "Nuevo",
    color: "bg-blue-100 text-blue-700"
  },
  interview: {
    label: "Entrevista",
    color: "bg-purple-100 text-purple-700"
  },
  reviewing: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700"
  },
  approved: {
    label: "Aprobado",
    color: "bg-green-100 text-green-700"
  },
  rejected: {
    label: "Descartado",
    color: "bg-red-100 text-[#D32F2F]"
  }
};
const avatarColors = ["bg-[#D32F2F]", "bg-blue-600", "bg-green-600", "bg-purple-600", "bg-orange-600", "bg-teal-600", "bg-pink-600", "bg-indigo-600", "bg-cyan-600", "bg-amber-600"];
export default function CandidateDirectory() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getRecruiterCandidates().then(rows => setCandidates(rows.map(row => ({
      ...row,
      status: {
        recibida: "new",
        en_revision: "reviewing",
        entrevista: "interview",
        aprobada: "approved",
        rechazada: "rejected"
      }[row.status] || row.status || "new",
      avatar: (row.name || "").split(" ").map(s => s[0]).slice(0, 2).join("")
    })))).catch(e => setError(e.message));
  }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;
  const filtered = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.job.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  return <div className="p-6">{error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Directorio de Postulantes</h1>
          <p className="text-sm text-[#475569]">{candidates.length} candidatos registrados</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }} type="text" placeholder="Buscar por nombre o puesto..." className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={e => {
          setStatusFilter(e.target.value);
          setCurrentPage(1);
        }} className="appearance-none pl-9 pr-8 py-2 text-sm bg-[#F8FAFC] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]">
            <option value="all">Todos los estados</option>
            <option value="new">Nuevo</option>
            <option value="reviewing">En revisión</option>
            <option value="interview">Entrevista</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Descartado</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Candidato</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Puesto</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider hidden lg:table-cell">Puntaje</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-[#475569] uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-[#475569] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((c, idx) => {
              const s = statusConfig[c.status];
              return <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {c.avatar}
                        </div>
                        <span className="text-sm font-medium text-[#1E293B] whitespace-nowrap">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#475569]">{c.job}</td>
                    <td className="px-5 py-3.5 text-xs text-[#475569] hidden md:table-cell">{c.date}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                          <div className={`h-full rounded-full ${c.score >= 85 ? "bg-green-500" : c.score >= 70 ? "bg-yellow-500" : "bg-[#D32F2F]"}`} style={{
                        width: `${c.score}%`
                      }} />
                        </div>
                        <span className="text-xs font-medium text-[#1E293B]">{c.score}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/reclutador/postulantes/${c.id}`} className="p-1.5 text-[#475569] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-colors" title="Ver perfil">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-[#475569] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Descargar CV">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-between">
          <p className="text-xs text-[#475569]">
            Mostrando {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length} resultados
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-[#475569] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({
            length: totalPages
          }).map((_, i) => <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === i + 1 ? "bg-[#D32F2F] text-white" : "text-[#475569] hover:bg-gray-200"}`}>
                {i + 1}
              </button>)}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-[#475569] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>;
}
