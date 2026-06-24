import React from "react";
import { Search, Plus } from "lucide-react";
import { C } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";

const VISTORIADORES = ["Leomar Caetano","Katia de Souza F.","Nelson Holanda"];
export default function Agenda() {
  const dias = Array.from({ length: 35 }, (_, i) => i - 5);
  const dots = (n) => Array.from({ length: n }).map((_, i) => {
    const cores = [C.gold, C.gold, C.green, C.amber, C.red];
    return <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
      background: cores[i % 5], display: "inline-block", margin: 1 }} />;
  });
  return (
    <div>
      <PageHeader title="Agenda" />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
          <Field label="Tipo de agenda" w={2}><select style={inputStyle}>
            <option>Agendamento + Indisponibilidade</option><option>Pré-agendamento</option></select></Field>
          <Field label="Vistoriador"><select style={inputStyle}><option value="">Todos</option>
            {VISTORIADORES.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Btn kind="primary" icon={Search}>Pesquisar</Btn><Btn kind="gold" icon={Plus}>Novo</Btn>
        </div>
        <div style={{ fontWeight: 700, marginBottom: 10, color: C.ink }}>junho 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {["dom","seg","ter","qua","qui","sex","sáb"].map(d=>
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.sub, padding: 6 }}>{d}</div>)}
          {dias.map((d, idx) => {
            const valid = d >= 1 && d <= 30;
            const count = valid ? ((d * 7) % 28) + 1 : 0;
            const hoje = d === 18;
            return (
              <div key={idx} style={{ minHeight: 86, border: `1px solid ${C.line}`, borderRadius: 8,
                padding: 6, background: hoje ? C.greenSoft : "#fff", opacity: valid ? 1 : 0.35 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {valid && count > 8 && <span style={{ background: C.red, color: "#fff", fontSize: 10,
                    fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{count}</span>}
                  <span style={{ fontSize: 12, fontWeight: hoje ? 800 : 500, marginLeft: "auto" }}>{valid ? d : ""}</span>
                </div>
                <div style={{ marginTop: 6, lineHeight: 1 }}>{valid && dots(Math.min(count, 12))}</div>
              </div>);
          })}
        </div>
      </Card>
    </div>
  );
}
