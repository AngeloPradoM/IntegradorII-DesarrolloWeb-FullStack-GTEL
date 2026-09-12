
import { useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import JobsGrid from "../../components/sections/JobsGrid";
import { jobs } from "../../utils/jobsData";

export default function OfertasLaboralesPage() {
  const [query, setQuery] = useState("");

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-brand-red font-semibold text-sm uppercase tracking-wide mb-2">
          Oportunidades disponibles
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3">
          Ofertas laborales
        </h1>
        <p className="text-brand-gray max-w-2xl">
          Encuentra la oportunidad que mejor se adapte a tu experiencia y
          desarrolla tu carrera con GTEL Talento.
        </p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={setQuery} />
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-brand-navy">
          Vacantes disponibles
        </h2>
        <span className="text-sm text-brand-gray">
          {filteredJobs.length} {filteredJobs.length === 1 ? "oferta" : "ofertas"}
        </span>
      </div>

      {filteredJobs.length > 0 ? (
        <JobsGrid jobs={filteredJobs} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            No encontramos ofertas
          </h2>
          <p className="text-brand-gray">
            Prueba con otro término de búsqueda.
          </p>
        </div>
      )}
    </main>
  );
}