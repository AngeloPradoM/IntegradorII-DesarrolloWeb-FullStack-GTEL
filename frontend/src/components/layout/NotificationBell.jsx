import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import {
  Bell,
  CheckCheck,
  Users,
  CheckCircle,
  Calendar,
  FileCheck2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function getNotificationVisuals(type) {
  switch (type) {
    case "POSTULACION_NUEVA":
      return {
        icon: Users,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
      };
    case "POSTULACION_REGISTRADA":
      return {
        icon: CheckCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/50",
      };
    case "ENTREVISTA_PROGRAMADA":
      return {
        icon: Calendar,
        color: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-100 dark:bg-amber-950/50",
      };
    case "REQUERIMIENTO_ESTADO":
      return {
        icon: FileCheck2,
        color: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-100 dark:bg-blue-950/50",
      };
    case "CANDIDATO_FASE":
      return {
        icon: Sparkles,
        color: "text-purple-600 dark:text-purple-400",
        badgeBg: "bg-purple-100 dark:bg-purple-950/50",
      };
    default:
      return {
        icon: Bell,
        color: "text-brand-red dark:text-red-400",
        badgeBg: "bg-red-100 dark:bg-red-950/50",
      };
  }
}

export default function NotificationBell({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Cerrar al presionar Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Abrir centro de notificaciones"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-brand-gray transition-colors hover:bg-slate-100 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-red/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Bell className="h-5 w-5" />

        {/* Indicador de conexión SSE activa */}
        {isConnected && (
          <span
            title="Conexión en vivo activa"
            className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
          />
        )}

        {/* Badge de conteo no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Centro de notificaciones"
          className="absolute right-0 z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-navy dark:text-slate-100">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-brand-red dark:bg-red-950/60 dark:text-red-300">
                  {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold text-brand-red transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Marcar todo leído</span>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                filter === "all"
                  ? "bg-white text-brand-navy shadow-sm font-semibold dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                filter === "unread"
                  ? "bg-white text-brand-navy shadow-sm font-semibold dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {/* Contenido de lista */}
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Cargando notificaciones...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {filter === "unread"
                    ? "No tienes notificaciones pendientes de lectura."
                    : "No tienes notificaciones en este momento."}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Los eventos y postulaciones en vivo aparecerán aquí.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const visuals = getNotificationVisuals(notification.type);
                const Icon = visuals.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !notification.read
                        ? "bg-red-50/30 dark:bg-slate-800/30"
                        : ""
                    }`}
                  >
                    {/* Icono de tipo */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${visuals.badgeBg} ${visuals.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Texto y detalles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-xs ${
                            !notification.read
                              ? "font-bold text-brand-navy dark:text-slate-100"
                              : "font-semibold text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-red"
                            title="No leída"
                          />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
                        {notification.description}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
                        <span>{notification.createdAt || "Reciente"}</span>
                        {notification.link && (
                          <span className="flex items-center gap-0.5 font-medium text-brand-red hover:underline dark:text-red-400">
                            <span>Ver</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pie de Centro de Notificaciones */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
            Conexión en tiempo real GTEL ATS
          </div>
        </div>
      )}
    </div>
  );
}
