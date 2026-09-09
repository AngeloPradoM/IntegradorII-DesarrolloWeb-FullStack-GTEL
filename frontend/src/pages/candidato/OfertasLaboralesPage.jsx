
import { useState } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import SearchBar from "../../components/common/SearchBar";
import JobsGrid from "../../components/sections/JobsGrid";
import { jobs } from "../../utils/jobsData";

export default function OfertasLaboralesPage() {
  const [query, setQuery] = useState("");

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-navy mb-6">
          Ofertas Laborales
        </h1>
        <div className="mb-8">
          <SearchBar onSearch={setQuery} />
        </div>
        <JobsGrid jobs={filteredJobs} />
      </main>
      <Footer />
    </div>
  );
}