import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { C } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";
import FormModal from "../components/FormModal";
import { supabase, supabaseReady } from "../lib/supabase";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const corTipo = { "Agendamento": C.green, "Pré-agendamento": C.amber, "Indisponibilidade": C.red };

export default function Agenda() {
  const hoje = new Date();
  const [ref, setRef] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() }); // mes 0-11
  const [filtroVist, setFiltroVist] = useState("");
  const [agendamentos, setAgendamentos] = useState([]);
  const [opts, setOpts] = useState({ imoveis: [], tipos: [], vistoriadores: [] });
  const [modal, setModal] = useState(null);

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
      .select("id, tipo, data_hora, vistoriador_id, locatario_nome, imovel:imoveis(endereco)")
      .gte("data_hora", ini).lt("data_hora", fim);
    if (filtroVist) q = q.eq("vistoriador_id", filtroVist);
    const { data } = await q;
    setAgendamentos(data || []);
  }, [ref, filtroVist]);

  useEffect(() => { carregar(); }, [carregar]);

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
                  {itens.length > 0 && <span style={{ background: C.green, color: "#fff", fontSize: 10,
                    fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{itens.length}</span>}
                  <span style={{ fontSize: 12, fontWeight: ehHoje(d) ? 800 : 500, marginLeft: "auto" }}>{d}</span>
                </div>
                <div style={{ marginTop: 4, lineHeight: 1.4 }}>
                  {itens.slice(0, 4).map(a => (
                    <div key={a.id} title={a.imovel?.endereco} style={{ display: "flex", gap: 4, alignItems: "center",
                      fontSize: 10, color: C.sub, whiteSpace: "nowrap", overflow: "hidden" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: corTipo[a.tipo] || C.sub, flexShrink: 0 }} />
                      {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} {a.locatario_nome || ""}
                    </div>))}
                  {itens.length > 4 && <div style={{ fontSize: 10, color: C.green }}>+{itens.length - 4}</div>}
                </div>
              </div>);
          })}
        </div></div>
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
    </div>
  );
}
