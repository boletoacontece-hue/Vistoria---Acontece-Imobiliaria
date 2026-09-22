import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseReady } from "./supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const papel = profile?.papel || "comercial";
  const permissoes = profile?.permissoes || {};
  // admin vê tudo; demais veem só os módulos liberados
  const podeVer = (modulo) => papel === "admin" || permissoes[modulo] === true;

  const value = {
    user, profile, loading, supabaseReady,
    entrar: (email, senha) => supabase.auth.signInWithPassword({ email, password: senha }),
    sair: () => supabase.auth.signOut(),
    papel, permissoes, podeVer,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
