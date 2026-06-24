import React, { useEffect, useState } from "react";
import { Search, Plus, Pencil } from "lucide-react";
import { C } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";
import { supabase, supabaseReady } from "../lib/supabase";
import { DEMO_IMOVEIS, DEMO_LOCADORES, DEMO_TIPOS } from "../lib/demo";

function Lista({ title, columns, fetchFn, demo }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!supabaseReady) { setRows(demo); return; }
    fetchFn().then(setRows).catch(() => setRows(demo));
  }, []);
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18, alignItems: "flex-end" }}>
          {columns.filter(c=>c.search).map(c=><Field key={c.key} label={c.label}><input style={inputStyle} /></Field>)}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <Btn kind="primary" icon={Search}>Pesquisar</Btn><Btn kind="gold" icon={Plus}>Novo</Btn></div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.line}`, color: C.sub, textAlign: "left" }}>
            {columns.map(c=><th key={c.key} style={{ padding: "10px 8px", fontSize: 11, textTransform: "uppercase" }}>{c.label}</th>)}
            <th></th></tr></thead>
          <tbody>{rows.map((r,i)=>(
            <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
              {columns.map(c=><td key={c.key} style={{ padding: "12px 8px" }}>{c.render?c.render(r[c.key]):r[c.key]}</td>)}
              <td style={{ padding: "12px 8px", textAlign: "right" }}><Pencil size={16} style={{ color: C.sub, cursor: "pointer" }} /></td>
            </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

export function Imoveis() {
  return <Lista title="Imóvel" demo={DEMO_IMOVEIS}
    fetchFn={() => supabase.from("imoveis").select("codigo_externo, endereco, ativo").limit(100).then(r=>r.data)}
    columns={[{key:"codigo_externo",label:"Código externo",search:true},
      {key:"endereco",label:"Endereço",search:true},{key:"ativo",label:"Ativo",render:v=>v?"Sim":"Não"}]} />;
}
export function Locadores() {
  return <Lista title="Locador" demo={DEMO_LOCADORES}
    fetchFn={() => supabase.from("locadores").select("nome, cpf_cnpj").limit(100).then(r=>r.data)}
    columns={[{key:"nome",label:"Nome",search:true},{key:"cpf_cnpj",label:"CPF/CNPJ",search:true}]} />;
}
export function Tipos() {
  return <Lista title="Tipo de vistoria" demo={DEMO_TIPOS}
    fetchFn={() => supabase.from("tipos_vistoria").select("nome, ativo").then(r=>r.data)}
    columns={[{key:"nome",label:"Nome",search:true},{key:"ativo",label:"Ativo",render:v=>v?"Sim":"Não"}]} />;
}
