import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import {
  getRecruiterNotifications,
  getNotificationUnreadCount,
  markRecruiterNotificationRead,
  markAllRecruiterNotificationsRead,
} from "../services/api";
import { normalizeNotification } from "../services/recruiterAdapters";

const NotificationContext = createContext(null);

const DEMO_FALLBACK_NOTIFICATIONS = [
  {
    id: "demo-1",
    title: "Nueva postulación recibida",
    description: "Carlos Mendoza se ha postulado a la vacante 'Ingeniero de Redes y Telecomunicaciones'.",
    type: "POSTULACION_NUEVA",
    link: "/reclutador/postulantes",
    read: false,
    createdAt: "Hace 15 min",
  },
  {
    id: "demo-2",
    title: "Requerimiento de personal",
    description: "Jefatura Solicitante ha registrado un nuevo requerimiento de puesto.",
    type: "REQUERIMIENTO_ESTADO",
    link: "/reclutador/requerimientos",
    read: false,
    createdAt: "Hace 1 hora",
  },
  {
    id: "demo-3",
    title: "Entrevista técnica asignada",
    description: "Se ha agendado una entrevista técnica con el candidato Carlos Mendoza.",
    type: "ENTREVISTA_PROGRAMADA",
    link: "/reclutador/entrevistas",
    read: true,
    createdAt: "Ayer",
  },
];

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryDelayRef = useRef(3000);

  // Cargar notificaciones iniciales desde el backend o fallback
  const fetchNotifications = useCallback(async () => {
    if (!user?.token) {
      setNotifications(DEMO_FALLBACK_NOTIFICATIONS);
      setUnreadCount(DEMO_FALLBACK_NOTIFICATIONS.filter((n) => !n.read).length);
      return;
    }

    try {
      setLoading(true);
      const list = await getRecruiterNotifications();
      if (Array.isArray(list) && list.length > 0) {
        setNotifications(list);
        const unread = list.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } else {
        // Si el usuario no tiene notificaciones aún
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // Fallback tolerante si falla la conexión HTTP
      if (notifications.length === 0) {
        setNotifications(DEMO_FALLBACK_NOTIFICATIONS);
        setUnreadCount(DEMO_FALLBACK_NOTIFICATIONS.filter((n) => !n.read).length);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  // Descartar un toast específico
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Agregar toast con auto-cierre
  const pushToast = useCallback((notif) => {
    const toastId = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const newToast = { ...notif, toastId };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      dismissToast(toastId);
    }, 6000);
  }, [dismissToast]);

  // Manejo de conexión Server-Sent Events (SSE) en vivo
  useEffect(() => {
    if (!user?.token) {
      setIsConnected(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    fetchNotifications();

    let isMounted = true;

    function connectSSE() {
      if (!isMounted || !user?.token) return;

      const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:8080";
      const sseUrl = `${apiBase.replace(/\/$/, "")}/api/notifications/stream?token=${encodeURIComponent(user.token)}`;

      try {
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          retryDelayRef.current = 3000; // Reset backoff
        };

        es.addEventListener("NOTIFICATION", (event) => {
          if (!isMounted) return;
          try {
            const rawData = JSON.parse(event.data);
            const normalized = normalizeNotification(rawData);

            setNotifications((prev) => {
              const exists = prev.some((n) => String(n.id) === String(normalized.id));
              if (exists) return prev;
              return [normalized, ...prev];
            });

            setUnreadCount((prev) => prev + 1);
            pushToast(normalized);
          } catch (err) {
            console.error("Error al procesar notificación SSE:", err);
          }
        });

        es.addEventListener("INIT", () => {
          if (isMounted) setIsConnected(true);
        });

        es.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          es.close();
          eventSourceRef.current = null;

          // Reintento con retroceso exponencial controlado (máx 15s)
          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(delay * 1.5, 15000);
          reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
        };
      } catch {
        setIsConnected(false);
      }
    }

    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user?.token, fetchNotifications, pushToast]);

  // Marcar una notificación como leída
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (user?.token && !String(id).startsWith("demo-")) {
      try {
        await markRecruiterNotificationRead(id);
      } catch (err) {
        console.warn("No se pudo sincronizar estado de lectura con el backend:", err);
      }
    }
  }, [user?.token]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    if (user?.token) {
      try {
        await markAllRecruiterNotificationsRead();
      } catch (err) {
        console.warn("No se pudo marcar todo como leído en el backend:", err);
      }
    }
  }, [user?.token]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    loading,
    toasts,
    dismissToast,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de un NotificationProvider");
  }
  return context;
}
