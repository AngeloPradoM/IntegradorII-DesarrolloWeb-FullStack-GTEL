import { useNotifications } from "../../context/NotificationContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Users,
  CheckCircle,
  Calendar,
  FileCheck2,
  Sparkles,
  X,
  ExternalLink,
  GripHorizontal,
} from "lucide-react";

function getNotificationVisuals(type) {
  switch (type) {
    case "OPERACION_SISTEMA":
      return {
        icon: CheckCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
        border: "border-emerald-300 dark:border-emerald-800",
      };
    case "POSTULACION_NUEVA":
      return {
        icon: Users,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
        border: "border-emerald-300 dark:border-emerald-800",
      };
    case "POSTULACION_REGISTRADA":
      return {
        icon: CheckCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
        border: "border-emerald-300 dark:border-emerald-800",
      };
    case "ENTREVISTA_PROGRAMADA":
      return {
        icon: Calendar,
        color: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-100 dark:bg-amber-950/50",
        border: "border-amber-300 dark:border-amber-800",
      };
    case "REQUERIMIENTO_ESTADO":
      return {
        icon: FileCheck2,
        color: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-100 dark:bg-blue-950/50",
        border: "border-blue-300 dark:border-blue-800",
      };
    case "CANDIDATO_FASE":
      return {
        icon: Sparkles,
        color: "text-purple-600 dark:text-purple-400",
        badgeBg: "bg-purple-100 dark:bg-purple-950/50",
        border: "border-purple-300 dark:border-purple-800",
      };
    default:
      return {
        icon: Bell,
        color: "text-brand-red dark:text-red-400",
        badgeBg: "bg-red-100 dark:bg-red-950/50",
        border: "border-red-300 dark:border-red-800",
      };
  }
}

export default function ToastNotifications() {
  const { toasts, dismissToast, markAsRead } = useNotifications();
  const [position, setPosition] = useState(null);
  const dragRef = useRef(null);
  useEffect(() => { if (toasts?.length === 1) setPosition(null); }, [toasts?.length]);

  const startDrag = (event) => {
    if (event.button !== 0) return;
    const container = event.currentTarget.closest('[data-toast-region]');
    const rect = container.getBoundingClientRect();
    dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const width = Math.min(384, window.innerWidth - 32);
    setPosition({
      left: Math.max(16, Math.min(window.innerWidth - width - 16, event.clientX - dragRef.current.offsetX)),
      top: Math.max(16, Math.min(window.innerHeight - 120, event.clientY - dragRef.current.offsetY)),
    });
  };
  const stopDrag = (event) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones y operaciones en vivo"
      data-toast-region
      style={position ? { left: position.left, top: position.top, right: "auto", bottom: "auto" } : undefined}
      className="fixed bottom-5 right-5 z-50 flex max-w-sm w-full flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => {
        const visuals = getNotificationVisuals(toast.type);
        const Icon = visuals.icon;

        return (
          <div
            key={toast.toastId}
            role="alert"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 dark:bg-slate-900 dark:shadow-slate-950/50 ${visuals.border}`}
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${visuals.badgeBg} ${visuals.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex touch-none cursor-move items-center justify-between gap-2" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <GripHorizontal className="mr-1 inline h-3.5 w-3.5" aria-hidden="true"/>{toast.type === "OPERACION_SISTEMA" ? "Operación" : "En tiempo real"}
                </span>
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissToast(toast.toastId);
                  }}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Cerrar notificación"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <h4 className="mt-0.5 text-sm font-semibold text-brand-navy dark:text-slate-100">
                {toast.title}
              </h4>

              <p className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
                {toast.description}
              </p>

              {toast.link && (
                <div className="mt-2.5 flex items-center gap-2">
                  <Link
                    to={toast.link}
                    onClick={() => {
                      if (toast.id) markAsRead(toast.id);
                      dismissToast(toast.toastId);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline dark:text-red-400"
                  >
                    <span>Ver detalle</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
