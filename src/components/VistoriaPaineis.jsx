import React, { useEffect, useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { Field, inputStyle, Btn } from "./ui";
import { supabase, supabaseReady } from "../lib/supabase";

// ---------- painel recolhível ----------
export function Painel({ titulo, aberto, onToggle, children }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "13px 18px", background: aberto ? C.greenSoft : "#fff",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: C.ink }}>
        <ChevronRight size={18} style={{ transform: aberto ? "rotate(90deg)" : "none", transition: ".15s", color: C.green }} />
        {titulo}
      </div>
      {aberto && <div style={{ padding: 18 }}>{children}</div>}
    </div>
  );
}

const ta = { ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: FONT };

// ---------- 1) Dados principais ----------
export function DadosPrincipais({ v, patch, onLocal }) {
  const [opts, setOpts] = useState({ vistoriadores: [], tipos: [] });
  useEffect(() => {
    if (!supabaseReady) return;
    Promise.all([
      supabase.from("vistoriadores").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("tipos_vistoria").select("id, nome").eq("ativo", true).order("nome"),
    ]).then(([vs, tp]) => setOpts({ vistoriadores: vs.data || [], tipos: tp.data || [] }));
  }, []);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <Field label="Imóvel (bloqueado)" w={4}>
        <div style={{ ...inputStyle, background: "#F1F3EF", color: C.sub }}>{v.imovel?.endereco || "—"}</div></Field>
      <Field label="Vistoriador *" w={2}>
        <select style={inputStyle} value={v.vistoriador_id || ""} onChange={e => {
          const id = e.target.value; const vs = opts.vistoriadores.find(x => x.id === id);
          patch({ vistoriador_id: id || null }); onLocal({ vistoriador: vs ? { nome: vs.nome } : null }); }}>
          <option value="">Selecione…</option>
          {opts.vistoriadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      <Field label="Tipo de vistoria *" w={2}>
        <select style={inputStyle} value={v.tipo_vistoria_id || ""} onChange={e => {
          const id = e.target.value; const t = opts.tipos.find(x => x.id === id);
          patch({ tipo_vistoria_id: id || null }); onLocal({ tipo: t ? { nome: t.nome } : null }); }}>
          <option value="">Selecione…</option>
          {opts.tipos.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></Field>
      <Field label="Data *" w={1}>
        <input type="date" style={inputStyle} value={v.data_vistoria || ""} onChange={e => patch({ data_vistoria: e.target.value })} /></Field>
      <Field label="Faxinado" w={1}>
        <select style={inputStyle} value={v.faxinado ? "sim" : "nao"} onChange={e => patch({ faxinado: e.target.value === "sim" })}>
          <option value="sim">Sim</option><option value="nao">Não</option></select></Field>
      <Field label="Chaves" w={4}>
        <textarea style={ta} value={v.chaves || ""} placeholder="Relação de chaves: 2 chaves simples porta do apto, 1 chave caixa de correios…"
          onChange={e => patch({ chaves: e.target.value })} /></Field>
    </div>
  );
}

// ---------- 2) Cabeçalho / Observação ----------
export function CabecalhoObs({ v, patch }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Cabeçalho (texto de abertura do termo)"><textarea style={ta} value={v.cabecalho || ""}
        onChange={e => patch({ cabecalho: e.target.value })} /></Field>
      <Field label="Observação (sai no termo)"><textarea style={{ ...ta, minHeight: 120 }} value={v.observacao || ""}
        placeholder={"- Paredes com pintura tinta acrílica branco neve fosco nova.\n- Obs: Será entregue fotos do imóvel pelo Google Drive"}
        onChange={e => patch({ observacao: e.target.value })} /></Field>
      <Field label="Observação interna (NÃO sai no termo)"><textarea style={ta} value={v.observacao_interna || ""}
        onChange={e => patch({ observacao_interna: e.target.value })} /></Field>
    </div>
  );
}

// ---------- 3) Medidores ----------
export const MEDIDORES = [
  ["agua", "Água"], ["energia", "Energia"], ["energia2", "Energia 2"], ["agua_quente", "Água quente"], ["gas", "Gás"],
];
export function Medidores({ v, patch }) {
  const m = v.medidores || {};
  const set = (k, campo, val) => patch({ medidores: { ...m, [k]: { ...(m[k] || {}), [campo]: val } } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {MEDIDORES.map(([k, label]) => (
        <div key={k} className="item-grid">
          <Field label={`Medidor ${label.toLowerCase()}`}><input style={inputStyle} value={m[k]?.medidor || ""}
            placeholder="nº do medidor" onChange={e => set(k, "medidor", e.target.value)} /></Field>
          <Field label={`Leitura ${label.toLowerCase()}`}><input style={inputStyle} value={m[k]?.leitura || ""}
            placeholder="leitura" onChange={e => set(k, "leitura", e.target.value)} /></Field>
          <Field label={`Situação ${label.toLowerCase()}`}>
            <select style={inputStyle} value={m[k]?.situacao || "Desligado"} onChange={e => set(k, "situacao", e.target.value)}>
              <option>Ligado</option><option>Desligado</option></select></Field>
        </div>
      ))}
    </div>
  );
}

// ---------- 4) Assinaturas ----------
export const TIPOS_ASSINATURA = [
  "Administradora", "Caucionante", "Cônjuge Fiador(a)", "Cônjuge Locador(a)", "Cônjuge Locatário(a)",
  "Conselho", "Contratada", "Contratante", "Fiador(a)", "Locador(a)", "Locatário(a)",
  "Procurador(a)", "Síndico(a)", "Testemunha", "Vistoriador(a)",
];
export function Assinaturas({ v, onLocal }) {
  const lista = v.assinaturas || [];
  const [nome, setNome] = useState(""); const [tipo, setTipo] = useState(""); const [erro, setErro] = useState("");

  async function adicionar() {
    if (!nome.trim()) return setErro("Informe o nome.");
    if (!tipo) return setErro("Você precisa informar o tipo de assinatura.");
    setErro("");
    const nova = { id: crypto.randomUUID(), vistoria_id: v.id, tipo, nome: nome.trim(), ordem: lista.length };
    if (supabaseReady) { const { error } = await supabase.from("assinaturas").insert(nova); if (error) return setErro(error.message); }
    onLocal({ assinaturas: [...lista, nova] }); setNome(""); setTipo("");
  }
  async function remover(id) {
    if (supabaseReady) await supabase.from("assinaturas").delete().eq("id", id);
    onLocal({ assinaturas: lista.filter(a => a.id !== id) });
  }

  return (
    <div>
      {lista.length === 0 && <div style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>Nenhuma assinatura cadastrada.</div>}
      {lista.map(a => (
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
          <div><b>{a.nome}</b> <span style={{ color: C.sub }}>— {a.tipo}</span></div>
          <Trash2 size={15} style={{ color: C.red, cursor: "pointer" }} onClick={() => remover(a.id)} />
        </div>))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginTop: 8 }}>
        <Field label="Nome *" w={2}><input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} /></Field>
        <Field label="Tipo de assinatura *" w={2}>
          <select style={inputStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Selecione…</option>{TIPOS_ASSINATURA.map(t => <option key={t}>{t}</option>)}</select></Field>
        <Btn kind="soft" icon={Plus} onClick={adicionar}>Adicionar</Btn>
      </div>
      {erro && <div style={{ color: C.red, fontSize: 12, marginTop: 6 }}>{erro}</div>}
    </div>
  );
}
