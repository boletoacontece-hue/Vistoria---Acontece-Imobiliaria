import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";
import FormModal from "../components/FormModal";
import { supabase, supabaseReady } from "../lib/supabase";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
// Paleta de status da agenda (mesma legenda do Devolus)
const STATUS = {
  "Em andamento":      "#2DA8C4", // azul/ciano
  "Atrasada":          "#E0A800", // amarelo
  "Concluída":         "#2E9E4F", // verde
  "Cancelada":         "#DC2626", // vermelho
  "Indisponibilidade": "#9AA0A6", // cinza
  "Pré-Agendamento":   "#7C3AED", // roxo
};
const LEGENDA = Object.entries(STATUS);

// Resolve o status visual de um agendamento (tipo tem prioridade sobre situação)
function statusAgendamento(a) {
  // situação final tem prioridade sobre o tipo
  if (a.situacao === "Cancelada")     return "Cancelada";
  if (a.situacao === "Concluída")     return "Concluída";
  if (a.tipo === "Indisponibilidade") return "Indisponibilidade";
  if (a.tipo === "Pré-agendamento")   return "Pré-Agendamento";
  if (a.situacao === "Em andamento")  return "Em andamento";
  // Agendada: aberta (futura) = em andamento; vencida sem conclusão = atrasada
  if (a.situacao === "Agendada")
    return new Date(a.data_hora) < new Date() ? "Atrasada" : "Em andamento";
  return "Em andamento";
}
const corAgendamento = (a) => STATUS[statusAgendamento(a)] || C.sub;

export default function Agenda() {
  const hoje = new Date();
  const [ref, setRef] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() }); // mes 0-11
  const [filtroVist, setFiltroVist] = useState("");
  const [agendamentos, setAgendamentos] = useState([]);
  const [opts, setOpts] = useState({ imoveis: [], tipos: [], vistoriadores: [] });
  const [modal, setModal] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  // carrega opções dos selects (uma vez)
  useEffect(() => {
    if (!supabaseReady) return;
    (async () => {
      const [im, tp, vs] = await Promise.all([
        supabase.from("imoveis").select("id, endereco").eq("ativo", true).limit(500),
        supabase.from("tipos_vistoria").select("id, nome").eq("ativo", true),
        supabase.from("vistoriadores").select("id, nome").eq("ativo", true),
      ]);
      setOpts({
        imoveis: (im.data || []).map(x => ({ value: x.id, label: x.endereco })),
        tipos: (tp.data || []).map(x => ({ value: x.id, label: x.nome })),
        vistoriadores: (vs.data || []).map(x => ({ value: x.id, label: x.nome })),
      });
    })();
  }, []);

  const carregar = useCallback(async () => {
    if (!supabaseReady) { setAgendamentos([]); return; }
    const ini = new Date(ref.ano, ref.mes, 1).toISOString();
    const fim = new Date(ref.ano, ref.mes + 1, 1).toISOString();
    let q = supabase.from("agendamentos")
      .select("id, tipo, situacao, data_hora, vistoriador_id, locatario_nome, imovel:imoveis(endereco)")
      .gte("data_hora", ini).lt("data_hora", fim);
    if (filtroVist) q = q.eq("vistoriador_id", filtroVist);
    const { data } = await q;
    setAgendamentos(data || []);
  }, [ref, filtroVist]);

  useEffect(() => { carregar(); }, [carregar]);

  async function mudarSituacao(id, situacao) {
    await supabase.from("agendamentos").update({ situacao }).eq("id", id);
    setDetalhe(null); await carregar();
  }

  async function salvar(v) {
    if (!supabaseReady) throw new Error("Configure o Supabase para gravar.");
    const payload = {
      tipo: v.tipo, data_hora: v.data_hora || null,
      imovel_id: v.imovel_id || null, tipo_vistoria_id: v.tipo_vistoria_id || null,
      vistoriador_id: v.vistoriador_id || null, locatario_nome: v.locatario_nome || null,
      observacao: v.observacao || null,
    };
    const { error } = await supabase.from("agendamentos").insert(payload);
    if (error) throw error;
    await carregar();
  }

  // monta a grade do mês
  const primeiroDia = new Date(ref.ano, ref.mes, 1).getDay(); // 0=dom
  const diasNoMes = new Date(ref.ano, ref.mes + 1, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

  const doDia = (d) => agendamentos.filter(a => new Date(a.data_hora).getDate() === d);
  const ehHoje = (d) => hoje.getFullYear() === ref.ano && hoje.getMonth() === ref.mes && hoje.getDate() === d;

  function navega(delta) {
    setRef(r => { let m = r.mes + delta, a = r.ano;
      if (m < 0) { m = 11; a--; } if (m > 11) { m = 0; a++; } return { ano: a, mes: m }; });
  }

  return (
    <div>
      <PageHeader title="Agenda" />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
          <Field label="Tipo de agenda" w={2}><select style={inputStyle}>
            <option>Agendamento + Indisponibilidade</option><option>Pré-agendamento</option></select></Field>
          <Field label="Vistoriador"><select style={inputStyle} value={filtroVist} onChange={e => setFiltroVist(e.target.value)}>
            <option value="">Todos</option>{opts.vistoriadores.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Btn kind="primary" icon={Search} onClick={carregar}>Pesquisar</Btn>
          <Btn kind="gold" icon={Plus} onClick={() => setModal({})}>Novo</Btn>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <ChevronLeft size={20} style={{ cursor: "pointer", color: C.green }} onClick={() => navega(-1)} />
          <div style={{ fontWeight: 700, color: C.ink, minWidth: 150 }}>{MESES[ref.mes]} {ref.ano}</div>
          <ChevronRight size={20} style={{ cursor: "pointer", color: C.green }} onClick={() => navega(1)} />
        </div>

        <div className="table-wrap"><div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, minWidth: 620 }}>
          {["dom","seg","ter","qua","qui","sex","sáb"].map(d =>
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.sub, padding: 6 }}>{d}</div>)}
          {celulas.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            const itens = doDia(d);
            return (
              <div key={idx} style={{ minHeight: 88, border: `1px solid ${C.line}`, borderRadius: 8,
                padding: 6, background: ehHoje(d) ? C.greenSoft : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {itens.length > 0 && <span style={{ background: C.sub, color: "#fff", fontSize: 10,
                    fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{itens.length}</span>}
                  <span style={{ fontSize: 12, fontWeight: ehHoje(d) ? 800 : 500, marginLeft: "auto" }}>{d}</span>
                </div>
                <div style={{ marginTop: 4, lineHeight: 1.4 }}>
                  {itens.slice(0, 4).map(a => (
                    <div key={a.id} title={a.imovel?.endereco} onClick={() => setDetalhe(a)}
                      style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer",
                      fontSize: 10, color: C.sub, whiteSpace: "nowrap", overflow: "hidden" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: corAgendamento(a), flexShrink: 0 }} />
                      {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} {a.locatario_nome || ""}
                    </div>))}
                  {itens.length > 4 && <div style={{ fontSize: 10, color: C.green }}>+{itens.length - 4}</div>}
                </div>
              </div>);
          })}
        </div></div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16, paddingTop: 14,
          borderTop: `1px solid ${C.line}` }}>
          {LEGENDA.map(([nome, cor]) => (
            <span key={nome} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.ink }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: cor }} /> {nome}
            </span>
          ))}
        </div>
      </Card>

      {modal && <FormModal title="Novo agendamento" onClose={() => setModal(null)} onSubmit={salvar}
        initial={{ tipo: "Agendamento" }}
        fields={[
          { key: "tipo", label: "Tipo de agenda", type: "select", required: true, w: 1,
            options: ["Agendamento", "Pré-agendamento", "Indisponibilidade"] },
          { key: "data_hora", label: "Data e hora", type: "datetime", required: true, w: 1 },
          { key: "imovel_id", label: "Imóvel", type: "select", w: 2, options: opts.imoveis },
          { key: "tipo_vistoria_id", label: "Tipo de vistoria", type: "select", w: 1, options: opts.tipos },
          { key: "vistoriador_id", label: "Vistoriador (opcional p/ pré-agendamento)", type: "select", w: 1, options: opts.vistoriadores },
          { key: "locatario_nome", label: "Locatário", w: 2 },
          { key: "observacao", label: "Observação", w: 2 },
        ]} />}

      {detalhe && (
        <div onClick={() => setDetalhe(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)",
          display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 440,
            maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ background: C.green, color: "#fff", padding: "14px 20px", display: "flex",
              justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Agendamento</h3>
              <span onClick={() => setDetalhe(null)} style={{ cursor: "pointer", fontSize: 20 }}>×</span>
            </div>
            <div style={{ padding: 20, fontSize: 13, lineHeight: 1.7 }}>
              <div><b>Data:</b> {new Date(detalhe.data_hora).toLocaleString("pt-BR")}</div>
              <div><b>Tipo:</b> {detalhe.tipo}</div>
              <div><b>Situação:</b> {detalhe.situacao || "Agendada"}</div>
              {detalhe.imovel?.endereco && <div><b>Imóvel:</b> {detalhe.imovel.endereco}</div>}
              {detalhe.locatario_nome && <div><b>Locatário:</b> {detalhe.locatario_nome}</div>}
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {detalhe.situacao === "Cancelada"
                ? <Btn kind="ghost" onClick={() => mudarSituacao(detalhe.id, "Agendada")}>Reabrir</Btn>
                : <>
                    <Btn kind="soft" onClick={() => mudarSituacao(detalhe.id, "Concluída")}>Concluir</Btn>
                    <button onClick={() => mudarSituacao(detalhe.id, "Cancelada")} style={{ background: "#FBE9E7",
                      color: C.red, border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700,
                      fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancelar agendamento</button>
                  </>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
