import React from "react";
import { LayoutDashboard, ClipboardCheck, Image as ImageIcon, ListChecks, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { C } from "../lib/theme";
import { PageHeader, Card, KpiCard, Field, Btn, inputStyle } from "../components/ui";

const porVistoriador = [
  { name: "Katia de Souza F.", value: 70, fill: C.gold },
  { name: "Leomar Caetano", value: 22.5, fill: C.green },
  { name: "Nelson Holanda", value: 7.5, fill: C.amber },
];
const porTipo = [
  { name: "Saída", value: 75, fill: C.gold },
  { name: "Entrada", value: 25, fill: C.green },
];

function ChartCard({ title, data }) {
  return <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
    <div style={{ fontWeight: 700, color: C.ink, marginBottom: 8 }}>{title}</div>
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}
          paddingAngle={2} label={({ value }) => `${value}%`}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} /><Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer></div>;
}

export default function Dashboard() {
  return <div>
    <PageHeader title="Dashboard" />
    <Card>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
        <Field label="Mês" w={2}><select style={inputStyle} defaultValue="Junho">
          {["Janeiro","Fevereiro","Março","Abril","Maio","Junho"].map(m=><option key={m}>{m}</option>)}</select></Field>
        <Field label="Ano" w={2}><select style={inputStyle} defaultValue="2026"><option>2025</option><option>2026</option></select></Field>
        <Btn kind="primary" icon={Search}>Pesquisar</Btn>
      </div>
      <div style={{ background: C.greenSoft, color: C.greenDark, borderRadius: 8, padding: "11px 16px",
        fontSize: 13, fontWeight: 600, marginBottom: 20 }}>ℹ️ Informações atualizadas todos os dias às 22h</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 26 }}>
        <KpiCard value="40/150" label="Vistorias" icon={ClipboardCheck} />
        <KpiCard value="2.799" label="Fotos" sub="(média 70/vistoria)" icon={ImageIcon} />
        <KpiCard value="53,2 / 80 GB" label="Armazenamento" icon={ListChecks} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
        <ChartCard title="Vistorias por vistoriador" data={porVistoriador} />
        <ChartCard title="Vistorias por tipo" data={porTipo} />
      </div>
    </Card>
  </div>;
}
