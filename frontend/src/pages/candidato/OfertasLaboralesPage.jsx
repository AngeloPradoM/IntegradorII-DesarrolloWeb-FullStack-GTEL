import { useState, useMemo } from "react";
import SearchBar from "../../components/common/SearchBar";
import JobsGrid from "../../components/sections/JobsGrid";
import { jobs } from "../../utils/jobsData";

export default function OfertasLaboralesPage() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedLocation, setSelectedLocation] = useState("Todas");
  const [sortBy, setSortBy] = useState("salary-low"); 

  const uniqueLocations = useMemo(() => {
    const locations = jobs
      .map((job) => job.location)
      .filter((loc) => loc); 
    
    return ["Todas", ...new Set(locations)];
  }, []);

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const matchQuery = job.title.toLowerCase().includes(query.toLowerCase());

      const matchType = 
        selectedType === "Todos" || 
        (job.type && job.type.toLowerCase() === selectedType.toLowerCase()) ||
        (job.tags && job.tags.some(tag => tag.toLowerCase() === selectedType.toLowerCase()));

      const matchLocation = 
        selectedLocation === "Todas" || 
        job.location === selectedLocation;

      return matchQuery && matchType && matchLocation;
    });

    if (sortBy === "salary-low") {
    } else if (sortBy === "salary-high") {
    }

    return result;
  }, [query, selectedType, selectedLocation, sortBy]);

  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-[#1B2431] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Encuentra tu próximo empleo en GTEL
          </h1>
          <p className="text-slate-300 mb-8">
            {jobs.length} oportunidades disponibles hoy
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            
            <div className="w-full sm:flex-1 max-w-3xl text-left bg-white rounded-lg flex items-center px-4 py-1.5 shadow-sm">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Buscar oferta laboral..." 
                className="flex-1 py-2 outline-none text-slate-700 bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-[12px] rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap ${
                showFilters 
                  ? "bg-[#D32F2F] text-white" 
                  : "bg-white text-slate-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              <svg 
                className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 bg-white rounded-xl p-6 shadow-md max-w-4xl mx-auto flex flex-col sm:flex-row gap-8 text-left animate-fade-in-down">
              
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Tipo de jornada
                </label>
                <div className="flex flex-wrap gap-3">
                  {["Todos", "Full-Time", "Part-Time"].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm ${
                        selectedType === type 
                          ? "bg-[#D32F2F] text-white" 
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Ubicación
                </label>
                <div className="relative">
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D32F2F] appearance-none cursor-pointer"
                  >
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === "Todas" ? "Todas las ubicaciones" : loc}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 text-slate-600">
          <span className="text-sm">
            <strong className="text-slate-900">{filteredJobs.length}</strong> resultados encontrados
          </span>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <label htmlFor="sort" className="text-sm">Ordenar por:</label>
            <select 
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="salary-high">Mayor salario</option>
              <option value="salary-low">Menor salario</option>
            </select>
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          <JobsGrid jobs={filteredJobs} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              No encontramos ofertas
            </h2>
            <p className="text-slate-500">
              Prueba con otros filtros o término de búsqueda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}