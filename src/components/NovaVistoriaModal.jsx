import React, { useEffect, useState } from "react";
import { X, Plus, Building2 } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { Btn, inputStyle, Field } from "./ui";
import { supabase, supabaseReady } from "../lib/supabase";

// Criação de vistoria: escolher imóvel existente OU cadastrar novo na hora.
export default function NovaVistoriaModal({ onClose, onCriada }) {
  const [opts, setOpts] = useState({ imoveis: [], tipos: [], vistoriadores: [] });
  const [novoImovel, setNovoImovel] = useState(false);
  const [f, setF] = useState({
    imovel_id: "", tipo_vistoria_id: "", vistoriador_id: "",
    data_vistoria: new Date().toISOString().slice(0, 10),
    endereco: "", codigo_externo: "", bairro: "", cidade: "Brasília", uf: "DF",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!supabaseReady) return;
    (async () => {
      const [im, tp, vs] = await Promise.all([
        supabase.from("imoveis").select("id, endereco, codigo_externo").eq("ativo", true).order("endereco").limit(1000),
        supabase.from("tipos_vistoria").select("id, nome").eq("ativo", true).order("nome"),
        supabase.from("vistoriadores").select("id, nome").eq("ativo", true).order("nome"),
      ]);
      setOpts({ imoveis: im.data || [], tipos: tp.data || [], vistoriadores: vs.data || [] });
      if (!(im.data || []).length) setNovoImovel(true);
    })();
  }, []);

  async function criar() {
    if (!supabaseReady) { setErro("Configure o Supabase para criar vistorias."); return; }
    if (!f.tipo_vistoria_id) return setErro("Selecione o tipo de vistoria.");
    if (novoImovel && !f.endereco.trim()) return setErro("Informe o endereço do imóvel.");
    if (!novoImovel && !f.imovel_id) return setErro("Selecione um imóvel ou cadastre um novo.");
    setErro(""); setSalvando(true);
    try {
      let imovelId = f.imovel_id;
      if (novoImovel) {
        const { data: novo, error: e1 } = await supabase.from("imoveis")
          .insert({ endereco: f.endereco.trim(), codigo_externo: f.codigo_externo || null,
            bairro: f.bairro || null, cidade: f.cidade || null, uf: f.uf || null, ativo: true })
          .select("id").single();
        if (e1) throw e1;
        imovelId = novo.id;
      }
      const { data: vist, error: e2 } = await supabase.from("vistorias")
        .insert({ imovel_id: imovelId, tipo_vistoria_id: f.tipo_vistoria_id,
          vistoriador_id: f.vistoriador_id || null, data_vistoria: f.data_vistoria, situacao: "Nova" })
        .select("id").single();
      if (e2) throw e2;
      onCriada(vist.id);
    } catch (e) { setErro(e.message || "Erro ao criar vistoria."); setSalvando(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)",
      display: "grid", placeItems: "center", zIndex: 100, fontFamily: FONT, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 560,
        maxWidth: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: C.green, color: "#fff", padding: "16px 22px", display: "flex",
          justifyContent: "space-between", alignItems: "center", borderRadius: "14px 14px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>Nova vistoria</h3>
          <X size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ padding: 22, display: "flex", flexWrap: "wrap", gap: 14 }}>
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>Imóvel <span style={{ color: C.red }}>*</span></div>
              <button onClick={() => setNovoImovel(n => !n)} style={{ background: "none", border: "none",
                color: C.green, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", gap: 4, alignItems: "center" }}>
                {novoImovel ? "↩ Escolher existente" : <><Plus size={13} /> Cadastrar novo imóvel</>}
              </button>
            </div>
            {!novoImovel ? (
              <select style={inputStyle} value={f.imovel_id} onChange={e => set("imovel_id", e.target.value)}>
                <option value="">Selecione o imóvel…</option>
                {opts.imoveis.map(i => <option key={i.id} value={i.id}>
                  {i.codigo_externo ? `${i.codigo_externo} - ` : ""}{i.endereco}</option>)}
              </select>
            ) : (
              <div style={{ border: `1px dashed ${C.line}`, borderRadius: 10, padding: 14, display: "flex", flexWrap: "wrap", gap: 12 }}>
                <div style={{ width: "100%", fontSize: 12, color: C.green, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
                  <Building2 size={15} /> Cadastro rápido do imóvel</div>
                <Field label="Endereço" w={4}><input style={inputStyle} value={f.endereco}
                  placeholder="Ex.: SQNW 311 BLOCO D, APTO 513 B, NOROESTE" onChange={e => set("endereco", e.target.value)} /></Field>
                <Field label="Código externo" w={1}><input style={inputStyle} value={f.codigo_externo}
                  onChange={e => set("codigo_externo", e.target.value)} /></Field>
                <Field label="Bairro" w={1}><input style={inputStyle} value={f.bairro} onChange={e => set("bairro", e.target.value)} /></Field>
                <Field label="Cidade" w={1}><input style={inputStyle} value={f.cidade} onChange={e => set("cidade", e.target.value)} /></Field>
                <Field label="UF" w={1}><input style={inputStyle} value={f.uf} onChange={e => set("uf", e.target.value)} /></Field>
              </div>
            )}
          </div>

          <Field label="Tipo de vistoria *" w={2}>
            <select style={inputStyle} value={f.tipo_vistoria_id} onChange={e => set("tipo_vistoria_id", e.target.value)}>
              <option value="">Selecione…</option>
              {opts.tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select></Field>
          <Field label="Vistoriador" w={2}>
            <select style={inputStyle} value={f.vistoriador_id} onChange={e => set("vistoriador_id", e.target.value)}>
              <option value="">A definir…</option>
              {opts.vistoriadores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select></Field>
          <Field label="Data" w={2}>
            <input type="date" style={inputStyle} value={f.data_vistoria} onChange={e => set("data_vistoria", e.target.value)} /></Field>

          {erro && <div style={{ width: "100%", color: C.red, fontSize: 13 }}>{erro}</div>}
        </div>

        <div style={{ padding: "0 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={criar}>{salvando ? "Criando…" : "Criar e abrir vistoria"}</Btn>
        </div>
      </div>
    </div>
  );
}
