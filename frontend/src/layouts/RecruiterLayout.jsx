import { Outlet, Link } from "react-router-dom";

export default function RecruiterLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-[#1B2431] flex flex-col justify-between">
        <div>
          <div className="p-4 flex items-center gap-3 text-white mb-6">
            <div className="bg-[#D32F2F] p-2 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">GTEL Talento</h2>
              <p className="text-[10px] text-slate-400 tracking-wider">RECLUTADOR</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <Link to="/reclutador/dashboard" className="bg-[#D32F2F] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3">
              Dashboard
            </Link>
            <Link to="#" className="text-slate-300 hover:bg-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors">
              Publicar Oferta
            </Link>
            <Link to="#" className="text-slate-300 hover:bg-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors">
              Postulantes
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-700 flex items-center gap-3 text-white">
          <div className="w-8 h-8 rounded-full bg-slate-500 overflow-hidden">
            <img src="https://i.pravatar.cc/150?img=1" alt="Ana García" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Ana García</p>
            <p className="text-xs text-slate-400">Reclutadora Senior</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="w-96 bg-slate-50 border border-slate-200 rounded-lg flex items-center px-3 py-1.5">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Buscar candidatos, ofertas..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#D32F2F] rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <img src="https://i.pravatar.cc/150?img=1" alt="Perfil" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-slate-700">Ana García</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}