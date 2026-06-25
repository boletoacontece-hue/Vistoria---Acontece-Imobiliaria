import React, { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Image as ImageIcon, ListChecks, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { C } from "../lib/theme";
import { PageHeader, Card, KpiCard, Field, Btn, inputStyle } from "../components/ui";
import { supabase, supabaseReady } from "../lib/supabase";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const PALETA = [C.gold, C.green, C.amber, C.blue, C.greenDark, C.red];

function agrupar(rows, chave) {
  const m = {};
  rows.forEach(r => { const k = r[chave] || "—"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([name, value], i) => ({ name, value, fill: PALETA[i % PALETA.length] }));
}

function ChartCard({ title, data }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 700, color: C.ink, marginBottom: 8 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ height: 240, display: "grid", placeItems: "center", color: C.sub, fontSize: 13 }}>
          Sem dados no período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}
              paddingAngle={2} label={({ value }) => value}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <Tooltip /><Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function Dashboard() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [stats, setStats] = useState({ vistorias: 0, fotos: 0, porVist: [], porTipo: [] });

  const carregar = useCallback(async () => {
    if (!supabaseReady) { setStats({ vistorias: 0, fotos: 0, porVist: [], porTipo: [] }); return; }
    const ini = new Date(ano, mes, 1).toISOString().slice(0, 10);
    const fim = new Date(ano, mes + 1, 1).toISOString().slice(0, 10);
    const { data: vis } = await supabase.from("vistorias")
      .select("id, vistoriador:vistoriadores(nome), tipo:tipos_vistoria(nome)")
      .gte("data_vistoria", ini).lt("data_vistoria", fim);
    const rows = (vis || []).map(v => ({ vistoriador: v.vistoriador?.nome, tipo: v.tipo?.nome }));
    const { count: fotos } = await supabase.from("fotos").select("id", { count: "exact", head: true });
    setStats({
      vistorias: rows.length, fotos: fotos || 0,
      porVist: agrupar(rows, "vistoriador"), porTipo: agrupar(rows, "tipo"),
    });
  }, [mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div>
      <PageHeader title="Dashboard" />
      <Card>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
          <Field label="Mês" w={2}><select style={inputStyle} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></Field>
          <Field label="Ano" w={2}><select style={inputStyle} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}</select></Field>
          <Btn kind="primary" icon={Search} onClick={carregar}>Pesquisar</Btn>
        </div>
        <div style={{ background: C.greenSoft, color: C.greenDark, borderRadius: 8, padding: "11px 16px",
          fontSize: 13, fontWeight: 600, marginBottom: 20 }}>ℹ️ Os indicadores são alimentados conforme as vistorias são cadastradas.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 26 }}>
          <KpiCard value={`${stats.vistorias}/150`} label="Vistorias" icon={ClipboardCheck} />
          <KpiCard value={stats.fotos} label="Fotos" icon={ImageIcon} />
          <KpiCard value="— / 80 GB" label="Armazenamento" icon={ListChecks} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
          <ChartCard title="Vistorias por vistoriador" data={stats.porVist} />
          <ChartCard title="Vistorias por tipo" data={stats.porTipo} />
        </div>
      </Card>
    </div>
  );
}
