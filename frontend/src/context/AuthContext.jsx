/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { AUTH_STORAGE_KEY, clearStoredUser, getStoredUser, setStoredUser } from "../utils/auth";

import { getCurrentUser } from "../services/api";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (typeof user?.token !== "string" || !user.token || (user.token === "demo-token" || user.token.startsWith("demo-session:") || user.demo)) return null;

  return {
    id: user.id,
    telefono: user.telefono || "",
    ubicacion: user.ubicacion || "",
    localidad: user.localidad || "",
    correoContacto: user.correoContacto || "",
    foto: user.foto || "",
    apellidos: user.apellidos,
    token: user.token || null,
    rol: user.rol || "CANDIDATO",
    nombres: user.nombres || user.name || (user.email ? user.email.split("@")[0] : "Usuario"),
    email: user.email || "usuario@demo.gtel.com",
    isVerified: user.isVerified ?? Boolean(user.token),
    verificationPending: user.verificationPending ?? false,
    demo: Boolean(user.demo || user.token?.startsWith("demo-session:")),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialUser] = useState(() => normalizeUser(getStoredUser()));
  const [restoring, setRestoring] = useState(Boolean(initialUser));
  const revision = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const current = revision.current;
    const stored = initialUser;
    if (!stored) {
      clearStoredUser();
      return;
    }
    getCurrentUser(stored.token).then(profile => {
      if (!cancelled && current === revision.current) setUser(normalizeUser({ ...profile, token: stored.token }));
    }).catch(() => {
      if (!cancelled && current === revision.current) clearStoredUser();
    }).finally(() => {
      if (!cancelled) setRestoring(false);
    });
    return () => { cancelled = true; };
  }, [initialUser]);

  useEffect(() => {
    if (restoring) return;
    if (user) {
      setStoredUser(user);
      return;
    }

    clearStoredUser();
  }, [user, restoring]);

  const login = (result = {}) => {
    if (!result.token || result.demo || !result.authenticated || !(result.verified === true || (result.authMethod === "TEST_PASSWORD" && result.otpSkipped === true))) throw new Error("No se pudo autenticar la cuenta.");
    revision.current += 1;
    const nextUser = normalizeUser({ ...result, token: result.token, email: result.email, rol: result.rol,
      nombres: result.nombres, isVerified: true, verificationPending: false, demo: result.demo });
    setStoredUser(nextUser);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    revision.current += 1;
    setUser(null);
    clearStoredUser();
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.token && user?.isVerified),
      isVerificationPending: Boolean(user?.token && user?.verificationPending && !user?.isVerified),
      login,
      logout,
      updateProfile: (profile) => {
        const next = normalizeUser({ ...user, ...profile, token: user.token, rol: user.rol });
        setStoredUser(next);
        setUser(next);
      },
    }),
    [user]
  );

  if (restoring) return <p role="status" className="p-6 text-center">Comprobando sesión...</p>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}

export function getAuthStorageKey() {
  return AUTH_STORAGE_KEY;
}
