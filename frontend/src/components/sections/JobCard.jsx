
import Badge from "../common/Badge";
import Button from "../common/Button";

export default function JobCard({ job }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative hover:shadow-md transition-shadow">
      <button className="absolute top-4 right-4 text-brand-gray hover:text-brand-red">
        ♡
      </button>

      <div className="flex gap-2 mb-3">
        <Badge color="gray">{job.type}</Badge>
        {job.isNew && <Badge color="red">NUEVO</Badge>}
      </div>

      <h3 className="font-bold text-brand-navy text-lg mb-2">{job.title}</h3>
      <p className="text-brand-gray text-sm mb-1">📍 {job.location}</p>
      <p className="text-brand-gray text-sm mb-4">💰 {job.salary}</p>

      <Button>Postular</Button>
    </div>
  );
}