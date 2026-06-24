import { supabase } from "./supabase";
import { enfileirar, online } from "./sync";

// Lista vistorias com joins legíveis (nome do imóvel, tipo, vistoriador)
export async function listarVistorias(filtros = {}) {
  let q = supabase.from("vistorias").select(`
    id, codigo, situacao, contestacao, data_vistoria,
    imovel:imoveis(endereco, codigo_externo),
    tipo:tipos_vistoria(nome),
    vistoriador:vistoriadores(nome)
  `).order("data_vistoria", { ascending: false }).limit(100);
  if (filtros.situacao) q = q.eq("situacao", filtros.situacao);
  if (filtros.codigo) q = q.eq("codigo", filtros.codigo);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// Carrega a vistoria completa (ambientes → itens → fotos)
export async function carregarVistoria(id) {
  const { data, error } = await supabase.from("vistorias").select(`
    *,
    imovel:imoveis(*), tipo:tipos_vistoria(nome), vistoriador:vistoriadores(nome),
    ambientes(*, itens(*)), fotos(*), assinaturas(*)
  `).eq("id", id).single();
  if (error) throw error;
  // ordena
  data.ambientes?.sort((a,b)=>a.ordem-b.ordem);
  data.ambientes?.forEach(a => a.itens?.sort((x,y)=>x.ordem-y.ordem));
  return data;
}

// Upsert com fallback offline
export async function salvar(tabela, payload) {
  if (!online()) { await enfileirar({ tabela, op: "upsert", payload }); return payload; }
  const { data, error } = await supabase.from(tabela).upsert(payload).select().single();
  if (error) { await enfileirar({ tabela, op: "upsert", payload }); throw error; }
  return data;
}

export async function remover(tabela, id) {
  if (!online()) { await enfileirar({ tabela, op: "delete", payload: { id } }); return; }
  const { error } = await supabase.from(tabela).delete().eq("id", id);
  if (error) throw error;
}

// Upload de foto para o Storage (caminho: vistorias/<vistoriaId>/<uuid>)
export async function enviarFoto(vistoriaId, file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `vistorias/${vistoriaId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("vistorias").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
