import { ShieldCheck } from "lucide-react";

export default function AuthCardFooter() {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-[#F8FAFC] px-7 py-4 text-[10px] text-[#475569]">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>Conexión segura con cifrado SSL/TLS</span>
    </div>
  );
}
