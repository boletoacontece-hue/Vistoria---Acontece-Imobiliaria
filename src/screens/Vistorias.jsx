import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreVertical, Pencil, FileText, Copy, Camera, Share2 } from "lucide-react";
import { C } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle, situacaoBadge } from "../components/ui";
import { listarVistorias, carregarVistoria, replicarVistoria, baixarFotosZip } from "../lib/vistoriasService";
import { gerarLaudoPDF } from "../lib/pdf";
import { supabase, supabaseReady } from "../lib/supabase";
import { DEMO_VISTORIAS } from "../lib/demo";
import NovaVistoriaModal from "../components/NovaVistoriaModal";

const TIPOS = ["Captação Avaliação","Entrada","Faxina (Limpeza)","Manutenção/Reparos","Reforma","Saída"];
const VISTORIADORES = ["Leomar Caetano","Katia de Souza F.","Nelson Holanda"];

export default function Vistorias() {
  const [rows, setRows] = useState([]);
  const [menu, setMenu] = useState(null);
  const [novaAberto, setNovaAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [mesCount, setMesCount] = useState(0);
  const nav = useNavigate();

  function carregar() {
    if (!supabaseReady) { setRows(DEMO_VISTORIAS); return; }
    listarVistorias().then(r => { setRows(r); setErro(""); })
      .catch(e => { setRows([]); setErro(e.message); });
    const hoje = new Date();
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString().slice(0, 10);
    supabase.from("vistorias").select("id", { count: "exact", head: true })
      .gte("data_vistoria", ini).lt("data_vistoria", fim)
      .then(({ count }) => setMesCount(count || 0));
  }
  useEffect(() => { carregar(); }, []);

  return (
    <div>
      <PageHeader title="Vistoria" right={<div style={{ textAlign: "right", fontSize: 13 }}>
        <div style={{ opacity: 0.85 }}>vistorias mês</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{mesCount}/150</div></div>} />
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 14, color: C.ink }}>Pesquisa</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <Field label="Código"><input style={inputStyle} /></Field>
          <Field label="Imóvel" w={3}><input style={inputStyle} /></Field>
          <Field label="Tipo de vistoria" w={2}><select style={inputStyle}><option value="">Todos</option>
            {TIPOS.map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Vistoriador" w={2}><select style={inputStyle}><option value="">Todos</option>
            {VISTORIADORES.map(v=><option key={v}>{v}</option>)}</select></Field>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="Situação"><select style={inputStyle}><option value="">Todas</option>
            {["Nova","Em andamento","Concluída","Contestada"].map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Situação da contestação"><select style={inputStyle}><option value="">Todas</option>
            {["Pendente","Contestada","Revisada","Não contestada"].map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Período"><input style={inputStyle} placeholder="dd/mm — dd/mm" /></Field>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <Btn kind="primary" icon={Search}>Pesquisar</Btn>
            <Btn kind="gold" icon={Plus} onClick={() => setNovaAberto(true)}>Novo</Btn>
          </div>
        </div>

        <div style={{ marginTop: 22, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.line}`, color: C.sub, textAlign: "left" }}>
              {["Código","Imóvel","Vistoriador","Tipo","Data","Situação",""].map(h=>
                <th key={h} style={{ padding: "10px 8px", fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: C.sub }}>
                  {erro ? `Erro: ${erro}` : "Nenhuma vistoria. Clique em Novo para criar a primeira."}</td></tr>)}
              {rows.map(v => (
                <tr key={v.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td onClick={()=>nav(`/vistorias/${v.id}`)} style={{ padding: "12px 8px", fontWeight: 700, color: C.green, cursor: "pointer" }}>{v.codigo}</td>
                  <td onClick={()=>nav(`/vistorias/${v.id}`)} style={{ padding: "12px 8px", maxWidth: 360, cursor: "pointer" }}>{v.imovel?.endereco}</td>
                  <td style={{ padding: "12px 8px" }}>{v.vistoriador?.nome}</td>
                  <td style={{ padding: "12px 8px" }}>{v.tipo?.nome}</td>
                  <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>{formatar(v.data_vistoria)}</td>
                  <td style={{ padding: "12px 8px" }}>{situacaoBadge(v.situacao)}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <MoreVertical size={18} style={{ cursor: "pointer", color: C.sub }} onClick={()=>setMenu(v)} />
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Card>

      {menu && (
        <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)",
          display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 320,
            maxWidth: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ background: C.green, color: "#fff", padding: "14px 18px", fontWeight: 700 }}>
              Vistoria {menu.codigo}</div>
            {[
              [Pencil, "Editar", () => nav(`/vistorias/${menu.id}`)],
              [FileText, "Download do termo (PDF)", async () => { const d = await carregarVistoria(menu.id); await gerarLaudoPDF(d); setMenu(null); }],
              [Camera, "Download das fotos (.zip)", async () => { try { await baixarFotosZip(menu.id, menu.codigo); } catch (e) { alert(e.message); } setMenu(null); }],
              [Copy, "Replicar", async () => { const id = await replicarVistoria(menu.id); setMenu(null); nav(`/vistorias/${id}`); }],
              [Share2, "Compartilhar via WhatsApp", () => {
                const link = `${window.location.origin}${import.meta.env.BASE_URL}#/vistorias/${menu.id}`;
                const txt = `Vistoria ${menu.codigo} — ${menu.tipo?.nome || ""}\n${menu.imovel?.endereco || ""}\n${link}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank"); setMenu(null); }],
            ].map(([Ic, label, fn], i, arr) => (
              <div key={i} onClick={fn} style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center",
                fontSize: 14, cursor: "pointer", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = C.greenSoft}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <Ic size={16} color={C.green} />{label}</div>))}
          </div>
        </div>
      )}

      {novaAberto && <NovaVistoriaModal onClose={() => setNovaAberto(false)}
        onCriada={(id) => { setNovaAberto(false); nav(`/vistorias/${id}`); }} />}
    </div>
  );
}
function formatar(d) { if (!d) return "—"; const [a,m,dia]=d.split("-"); return `${dia}/${m}/${a}`; }
