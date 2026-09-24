/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_STORAGE_KEY, clearStoredUser, getStoredUser, setStoredUser } from "../utils/auth";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user?.token || user.token === "demo-token") return null;

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
  const [user, setUser] = useState(() => normalizeUser(getStoredUser()));

  useEffect(() => {
    if (user) {
      setStoredUser(user);
      return;
    }

    clearStoredUser();
  }, [user]);

  const login = (result = {}) => {
    if (!result.token) throw new Error("Debes completar la verificación OTP");
    const nextUser = normalizeUser({ ...result, token: result.token, email: result.email, rol: result.rol,
      nombres: result.nombres, isVerified: true, verificationPending: false, demo: result.demo });
    setStoredUser(nextUser);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
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
