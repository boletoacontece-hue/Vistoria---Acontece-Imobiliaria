// Offline-first: quando sem conexão, as gravações entram numa fila
// persistida em IndexedDB e são reenviadas quando a rede volta.
import { get, set } from "idb-keyval";
import { supabase } from "./supabase";

const QUEUE_KEY = "fila_sync";

export const online = () => navigator.onLine;

async function lerFila() { return (await get(QUEUE_KEY)) || []; }
async function gravarFila(f) { await set(QUEUE_KEY, f); }

// Enfileira uma operação { tabela, op: 'upsert'|'delete', payload }
export async function enfileirar(op) {
  const fila = await lerFila();
  fila.push({ ...op, ts: Date.now() });
  await gravarFila(fila);
}

// Processa a fila (chamado ao voltar online)
export async function sincronizar() {
  if (!online()) return { enviadas: 0, pendentes: (await lerFila()).length };
  let fila = await lerFila();
  const restantes = [];
  let enviadas = 0;
  for (const item of fila) {
    try {
      if (item.op === "delete") {
        await supabase.from(item.tabela).delete().eq("id", item.payload.id);
      } else {
        await supabase.from(item.tabela).upsert(item.payload);
      }
      enviadas++;
    } catch (e) {
      restantes.push(item); // mantém na fila para nova tentativa
    }
  }
  await gravarFila(restantes);
  return { enviadas, pendentes: restantes.length };
}

export async function pendentes() { return (await lerFila()).length; }

// Auto-sincroniza quando a conexão retorna
if (typeof window !== "undefined") {
  window.addEventListener("online", () => sincronizar());
}
