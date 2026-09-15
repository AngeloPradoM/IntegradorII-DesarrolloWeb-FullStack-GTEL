const recentApplications = [
  { id: 1, init: "CR", name: "Carlos Rodríguez", role: "Agente de Ventas", date: "Hoy 09:15", status: "Nuevo", color: "bg-red-600", badge: "bg-blue-100 text-blue-700" },
  { id: 2, init: "ML", name: "María López", role: "Supervisor Call Center", date: "Hoy 08:42", status: "Entrevista", color: "bg-blue-600", badge: "bg-purple-100 text-purple-700" },
  { id: 3, init: "JP", name: "José Pérez", role: "Soporte Técnico", date: "Ayer 17:30", status: "En revisión", color: "bg-green-600", badge: "bg-yellow-100 text-yellow-700" },
  { id: 4, init: "AT", name: "Ana Torres", role: "Agente Bilingüe", date: "Ayer 14:15", status: "Aprobado", color: "bg-purple-600", badge: "bg-green-100 text-green-700" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Lunes, 19 de Mayo 2026</p>
        </div>
        <button className="bg-[#D32F2F] text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-red-700 transition-colors">
          + Publicar Oferta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">↗ +12%</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">147</h3>
          <p className="text-sm font-medium text-slate-700">Nuevos Postulantes</p>
          <p className="text-xs text-slate-400">esta semana</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">↗ +5%</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">24</h3>
          <p className="text-sm font-medium text-slate-700">Entrevistas Programadas</p>
          <p className="text-xs text-slate-400">próximos 7 días</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">↘ -2%</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">8</h3>
          <p className="text-sm font-medium text-slate-700">Ofertas Activas</p>
          <p className="text-xs text-slate-400">publicadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Últimas Postulaciones</h2>
            <button className="text-[#D32F2F] text-sm font-medium hover:underline">Ver todas →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Candidato</th>
                  <th className="px-6 py-4">Puesto</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${app.color}`}>
                        {app.init}
                      </span>
                      <span className="font-medium text-slate-800">{app.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{app.role}</td>
                    <td className="px-6 py-4 text-slate-500">{app.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${app.badge}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button className="text-slate-400 hover:text-blue-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                      <button className="text-slate-400 hover:text-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 text-left mb-1">Postulaciones por área</h2>
            <p className="text-xs text-slate-500 text-left mb-6">Distribución del mes actual</p>
            <div className="relative w-40 h-40 mx-auto rounded-full border-[16px] border-slate-800 border-r-[#D32F2F] border-t-[#D32F2F] border-b-blue-500 mb-4"></div>
            <div className="flex justify-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#D32F2F] rounded-full"></div> Ventas</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-800 rounded-full"></div> Soporte</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Supervisión</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Acciones rápidas</h2>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-2"><svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Revisar CVs pendientes</span>
                <span className="text-yellow-600 font-bold">23</span>
              </li>
              <li className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Entrevistas de hoy</span>
                <span className="text-blue-600 font-bold">4</span>
              </li>
              <li className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Aprobaciones pendientes</span>
                <span className="text-green-600 font-bold">7</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}