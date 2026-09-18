import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { AuthenticatedUser, UserProfile, RegisterInput } from "@redvital/api-client";
import { api, secureRefreshKey } from "./api";

type SessionContextValue = { user: AuthenticatedUser | null; profile: UserProfile | null; loading: boolean; authenticated: boolean; login: (email: string, password: string) => Promise<void>; register: (input: RegisterInput) => Promise<void>; logout: () => Promise<void>; refreshSession: () => Promise<boolean>; reloadProfile: () => Promise<void>; updateAvailability: (available: boolean) => Promise<void>; updateProfile: (input: Partial<UserProfile>) => Promise<void>; };
const SessionContext = createContext<SessionContextValue | null>(null);
const message = (error: unknown) => { const text = error instanceof Error ? error.message : ""; if (text.includes("409")) return "Ese email ya está registrado."; if (text.includes("401")) return "Email o contraseña incorrectos."; if (text.includes("403")) return "No tenés autorización para realizar esta acción."; if (text.includes("400")) return "Revisá los datos ingresados."; return "No pudimos completar la operación. Intentá nuevamente."; };
export const apiErrorMessage = message;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null); const [profile, setProfile] = useState<UserProfile | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async (token: string) => { api.setAccessToken(token); const current = await api.me(); setUser(current); setProfile(await api.myProfile()); }, []);
  const refreshSession = useCallback(async () => { const old = await SecureStore.getItemAsync(secureRefreshKey); if (!old) return false; try { const session = await api.refresh(old, "mobile"); if (!session.accessToken || !session.refreshToken) throw new Error("401"); await SecureStore.setItemAsync(secureRefreshKey, session.refreshToken); await load(session.accessToken); return true; } catch { await SecureStore.deleteItemAsync(secureRefreshKey); api.clearAccessToken(); setUser(null); setProfile(null); return false; } }, [load]);
  useEffect(() => { api.setUnauthorizedHandler(refreshSession); refreshSession().finally(() => setLoading(false)); return () => api.setUnauthorizedHandler(null); }, [refreshSession]);
  const login = useCallback(async (email: string, password: string) => { const session = await api.login(email, password, "mobile"); if (!session.accessToken || !session.refreshToken) throw new Error("401"); await SecureStore.setItemAsync(secureRefreshKey, session.refreshToken); await load(session.accessToken); }, [load]);
  const register = useCallback(async (input: RegisterInput) => { await api.register(input); }, []);
  const logout = useCallback(async () => { const token = await SecureStore.getItemAsync(secureRefreshKey); try { if (token) await api.logout(token, "mobile"); } finally { await SecureStore.deleteItemAsync(secureRefreshKey); api.clearAccessToken(); setUser(null); setProfile(null); } }, []);
  const reloadProfile = useCallback(async () => { if (user) setProfile(await api.myProfile()); }, [user]);
  const updateAvailability = useCallback(async (available: boolean) => { await api.requestAvailability(available); setProfile(await api.myProfile()); }, []);
  const updateProfile = useCallback(async (input: Partial<UserProfile>) => { await api.updateMyProfile(input); setProfile(await api.myProfile()); }, []);
  const value = useMemo(() => ({ user, profile, loading, authenticated: Boolean(user), login, register, logout, refreshSession, reloadProfile, updateAvailability, updateProfile }), [user, profile, loading, login, register, logout, refreshSession, reloadProfile, updateAvailability, updateProfile]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() { const value = useContext(SessionContext); if (!value) throw new Error("useSession must be used inside SessionProvider"); return value; }
