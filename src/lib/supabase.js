import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("Supabase não configurado — copie .env.example para .env e preencha.");
}

export const supabase = createClient(url || "http://localhost", key || "anon", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const supabaseReady = Boolean(url && key);

// Cliente isolado (não persiste sessão) — usado para criar usuários
// sem substituir a sessão do admin logado.
export function clienteEfemero() {
  return createClient(url || "http://localhost", key || "anon", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "sb-tmp-" + Math.random().toString(36).slice(2) },
  });
}
