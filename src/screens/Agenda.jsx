import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";
import FormModal from "../components/FormModal";
import { supabase, supabaseReady } from "../lib/supabase";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

// Paleta de status (legenda Devolus)
const STATUS = {
  "Em andamento": "#2DA8C4", "Atrasada": "#E0A800", "Concluída": "#2E9E4F",
  "Cancelada": "#DC2626", "Indisponibilidade": "#9AA0A6", "Pré-Agendamento": "#7C3AED",
};
const LEGENDA = Object.entries(STATUS);
function statusAgendamento(a) {
  if (a.situacao === "Cancelada") return "Cancelada";
  if (a.situacao === "Concluída") return "Concluída";
  if (a.tipo === "Indisponibilidade") return "Indisponibilidade";
  if (a.tipo === "Pré-agendamento") return "Pré-Agendamento";
  if (a.situacao === "Em andamento") return "Em andamento";
  if (a.situacao === "Agendada") return new Date(a.data_hora) < new Date() ? "Atrasada" : "Em andamento";
  return "Em andamento";
}
const cor = (a) => STATUS[statusAgendamento(a)] || C.sub;
const hora = (d) => d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
const toLocalInput = (d) => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

export default function Agenda() {
  const hoje = new Date();
  const [ref, setRef] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [diaSel, setDiaSel] = useState(hoje.getDate());
  const [filtroVist, setFiltroVist] = useState("");
  const [ags, setAgs] = useState([]);
  const [opts, setOpts] = useState({ imoveis: [], tipos: [], vistoriadores: [] });
  const [modal, setModal] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    if (!supabaseReady) return;
    (async () => {
      const [im, tp, vs] = await Promise.all([
        supabase.from("imoveis").select("id, endereco, codigo_externo").eq("ativo", true).order("endereco").limit(1000),
        supabase.from("tipos_vistoria").select("id, nome").eq("ativo", true).order("nome"),
        supabase.from("vistoriadores").select("id, nome").eq("ativo", true).order("nome"),
      ]);
      setOpts({
        imoveis: (im.data || []).map(x => ({ value: x.id, label: (x.codigo_externo ? x.codigo_externo + " - " : "") + x.endereco })),
        tipos: (tp.data || []).map(x => ({ value: x.id, label: x.nome })),
        vistoriadores: (vs.data || []).map(x => ({ value: x.id, label: x.nome })),
      });
    })();
  }, []);

  const carregar = useCallback(async () => {
    if (!supabaseReady) { setAgs([]); return; }
    const ini = new Date(ref.ano, ref.mes, 1).toISOString();
    const fim = new Date(ref.ano, ref.mes + 1, 1).toISOString();
    let q = supabase.from("agendamentos")
      .select("id, tipo, situacao, data_hora, data_fim, duracao_min, vistoriador_id, tipo_vistoria_id, imovel_id, locatario_nome, observacao, imovel:imoveis(endereco, codigo_externo), vistoriador:vistoriadores(nome), tipo_vistoria:tipos_vistoria(nome)")
      .gte("data_hora", ini).lt("data_hora", fim).order("data_hora");
    if (filtroVist) q = q.eq("vistoriador_id", filtroVist);
    const { data } = await q; setAgs(data || []);
  }, [ref, filtroVist]);
  useEffect(() => { carregar(); }, [carregar]);

  async function criar(v) {
    if (!supabaseReady) throw new Error("Configure o Supabase para gravar.");
    const { error } = await supabase.from("agendamentos").insert({
      tipo: v.tipo, data_hora: v.data_hora || null, data_fim: v.data_fim || null,
      imovel_id: v.imovel_id || null, tipo_vistoria_id: v.tipo_vistoria_id || null,
      vistoriador_id: v.vistoriador_id || null, locatario_nome: v.locatario_nome || null, observacao: v.observacao || null,
    });
    if (error) throw error; await carregar();
  }
  async function salvarEdicao(a) {
    const { error } = await supabase.from("agendamentos").update({
      tipo: a.tipo, situacao: a.situacao, data_hora: a.data_hora, data_fim: a.data_fim || null,
      imovel_id: a.imovel_id || null, tipo_vistoria_id: a.tipo_vistoria_id || null,
      vistoriador_id: a.vistoriador_id || null, locatario_nome: a.locatario_nome || null, observacao: a.observacao || null,
    }).eq("id", a.id);
    if (error) throw error; setDetalhe(null); await carregar();
  }

  // grade do mês
  const primeiro = new Date(ref.ano, ref.mes, 1).getDay();
  const dias = new Date(ref.ano, ref.mes + 1, 0).getDate();
  const cel = [...Array(primeiro).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  const doDia = (d) => ags.filter(a => new Date(a.data_hora).getDate() === d);
  const ehHoje = (d) => hoje.getFullYear() === ref.ano && hoje.getMonth() === ref.mes && hoje.getDate() === d;
  const navega = (dl) => { setRef(r => { let m = r.mes + dl, a = r.ano; if (m < 0) { m = 11; a--; } if (m > 11) { m = 0; a++; } return { ano: a, mes: m }; }); setDiaSel(1); };
  const lista = diaSel ? doDia(diaSel) : [];

  return (
    <div>
      <PageHeader title="Agenda" />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
          <Field label="Vistoriador" w={2}><select style={inputStyle} value={filtroVist} onChange={e => setFiltroVist(e.target.value)}>
            <option value="">Todos</option>{opts.vistoriadores.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Btn kind="primary" icon={Search} onClick={carregar}>Pesquisar</Btn>
          <Btn kind="gold" icon={Plus} onClick={() => setModal({})}>Novo</Btn>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <ChevronLeft size={20} style={{ cursor: "pointer", color: C.green }} onClick={() => navega(-1)} />
          <div style={{ fontWeight: 700, minWidth: 150 }}>{MESES[ref.mes]} {ref.ano}</div>
          <ChevronRight size={20} style={{ cursor: "pointer", color: C.green }} onClick={() => navega(1)} />
        </div>

        {/* calendário compacto: clique no dia mostra a lista abaixo */}
        <div className="table-wrap"><div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, minWidth: 560 }}>
          {["dom","seg","ter","qua","qui","sex","sáb"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.sub, padding: 6 }}>{d}</div>)}
          {cel.map((d, i) => {
            if (d === null) return <div key={i} />;
            const its = doDia(d), sel = diaSel === d;
            return (
              <div key={i} onClick={() => setDiaSel(d)} style={{ minHeight: 64, border: `2px solid ${sel ? C.green : C.line}`, borderRadius: 8,
                padding: 6, background: sel ? C.greenSoft : ehHoje(d) ? "#F4F8F2" : "#fff", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {its.length > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{its.length}</span>}
                  <span style={{ fontSize: 12, fontWeight: ehHoje(d) ? 800 : 500, marginLeft: "auto" }}>{d}</span>
                </div>
                <div style={{ marginTop: 6, lineHeight: 1 }}>
                  {its.slice(0, 18).map(a => <span key={a.id} style={{ width: 7, height: 7, borderRadius: "50%", background: cor(a), display: "inline-block", margin: 1 }} />)}
                </div>
              </div>);
          })}
        </div></div>

        {/* lista do dia (layout Devolus) */}
        <div style={{ marginTop: 18, background: "#3A3F3A", borderRadius: 10, padding: 10 }}>
          {lista.length === 0 && <div style={{ color: "#ddd", padding: 12, fontSize: 13 }}>Nenhum agendamento em {String(diaSel).padStart(2,"0")}/{String(ref.mes+1).padStart(2,"0")}.</div>}
          {lista.map(a => (
            <div key={a.id} onClick={() => setDetalhe({ ...a })} style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 12, fontSize: 13, cursor: "pointer" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cor(a), flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <b>{a.vistoriador?.nome || "Sem vistoriador"}</b> ({a.tipo === "Agendamento" ? (a.tipo_vistoria?.nome || "Vistoria") : a.tipo}) {a.imovel ? `${a.imovel.codigo_externo ? a.imovel.codigo_externo + " - " : ""}${a.imovel.endereco}` : a.locatario_nome || ""} ({hora(a.data_hora)}{a.data_fim ? ` até ${hora(a.data_fim)}` : ""})
              </span>
              <Pencil size={16} color={C.sub} />
            </div>))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          {LEGENDA.map(([n, c]) => <span key={n} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: c }} /> {n}</span>)}
        </div>
      </Card>

      {modal && <FormModal title="Novo agendamento" onClose={() => setModal(null)} onSubmit={criar} initial={{ tipo: "Agendamento" }}
        fields={[
          { key: "tipo", label: "Tipo de agenda", type: "select", required: true, w: 1, options: ["Agendamento", "Pré-agendamento", "Indisponibilidade"] },
          { key: "data_hora", label: "Início", type: "datetime", required: true, w: 1 },
          { key: "data_fim", label: "Fim", type: "datetime", w: 1 },
          { key: "imovel_id", label: "Imóvel", type: "select", w: 2, options: opts.imoveis },
          { key: "tipo_vistoria_id", label: "Tipo de vistoria", type: "select", w: 1, options: opts.tipos },
          { key: "vistoriador_id", label: "Vistoriador", type: "select", w: 1, options: opts.vistoriadores },
          { key: "locatario_nome", label: "Locatário", w: 2 }, { key: "observacao", label: "Observação", w: 2 },
        ]} />}

      {detalhe && <DetalheAgendamento a={detalhe} setA={setDetalhe} opts={opts} onSalvar={salvarEdicao} onClose={() => setDetalhe(null)} />}
    </div>
  );
}

// Janela de visualização/edição do agendamento (layout Devolus)
function DetalheAgendamento({ a, setA, opts, onSalvar, onClose }) {
  const [erro, setErro] = useState("");
  const set = (k, v) => setA(s => ({ ...s, [k]: v }));
  const salvar = async (extra = {}) => { try { await onSalvar({ ...a, ...extra }); } catch (e) { setErro(e.message); } };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)", display: "grid", placeItems: "center", zIndex: 100, padding: 16, fontFamily: FONT }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 640, maxWidth: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: C.green, color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Agendamento</h3><X size={20} style={{ cursor: "pointer" }} onClick={onClose} /></div>
        <div style={{ padding: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Field label="Vistoriador" w={2}><select style={inputStyle} value={a.vistoriador_id || ""} onChange={e => set("vistoriador_id", e.target.value)}>
            <option value="">A definir…</option>{opts.vistoriadores.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Field label="Tipo de vistoria" w={2}><select style={inputStyle} value={a.tipo_vistoria_id || ""} onChange={e => set("tipo_vistoria_id", e.target.value)}>
            <option value="">—</option>{opts.tipos.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Field label="Data início" w={1}><input type="datetime-local" style={inputStyle} value={toLocalInput(a.data_hora)} onChange={e => set("data_hora", e.target.value)} /></Field>
          <Field label="Data fim" w={1}><input type="datetime-local" style={inputStyle} value={toLocalInput(a.data_fim)} onChange={e => set("data_fim", e.target.value)} /></Field>
          <Field label="Situação" w={1}><select style={inputStyle} value={a.situacao || "Agendada"} onChange={e => set("situacao", e.target.value)}>
            {["Agendada","Em andamento","Concluída","Cancelada"].map(s => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Tipo de agenda" w={1}><select style={inputStyle} value={a.tipo} onChange={e => set("tipo", e.target.value)}>
            {["Agendamento","Pré-agendamento","Indisponibilidade"].map(s => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Imóvel" w={4}><select style={inputStyle} value={a.imovel_id || ""} onChange={e => set("imovel_id", e.target.value)}>
            <option value="">—</option>{opts.imoveis.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Field label="Locatário" w={2}><input style={inputStyle} value={a.locatario_nome || ""} onChange={e => set("locatario_nome", e.target.value)} /></Field>
          <Field label="Observação" w={2}><input style={inputStyle} value={a.observacao || ""} onChange={e => set("observacao", e.target.value)} /></Field>
          {erro && <div style={{ width: "100%", color: C.red, fontSize: 13 }}>{erro}</div>}
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {a.situacao === "Cancelada"
            ? <Btn kind="ghost" onClick={() => salvar({ situacao: "Agendada" })}>Reabrir</Btn>
            : <>
                <Btn kind="soft" onClick={() => salvar({ situacao: "Concluída" })}>Concluir</Btn>
                <button onClick={() => salvar({ situacao: "Cancelada" })} style={{ background: "#FBE9E7", color: C.red, border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancelar agendamento</button>
              </>}
          <Btn kind="primary" onClick={() => salvar()}>Salvar</Btn>
        </div>
      </div>
    </div>
  );
}
