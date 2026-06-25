import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ChevronRight, Camera, AlertTriangle, FileText,
  Building2, ListChecks } from "lucide-react";
import { C, ESTADOS, estadoCor } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle, situacaoBadge, Badge } from "../components/ui";
import { carregarVistoria, salvar, enviarFoto } from "../lib/vistoriasService";
import { supabaseReady } from "../lib/supabase";
import { DEMO_DETALHE } from "../lib/demo";
import { gerarLaudoPDF } from "../lib/pdf";

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    if (!supabaseReady) { setV(DEMO_DETALHE); setAberto(DEMO_DETALHE.ambientes[0]?.id); return; }
    carregarVistoria(id).then(d => { setV(d); setAberto(d.ambientes?.[0]?.id); })
      .catch(() => { setV(DEMO_DETALHE); setAberto(DEMO_DETALHE.ambientes[0]?.id); });
  }, [id]);

  const totalDiv = useMemo(() =>
    v?.ambientes?.reduce((a, amb) => a + amb.itens.filter(i => i.divergencia).length, 0) || 0, [v]);

  if (!v) return <div style={{ padding: 40 }}>Carregando…</div>;

  function patchItem(ambId, itemId, patch) {
    const ambientes = v.ambientes.map(a => a.id === ambId
      ? { ...a, itens: a.itens.map(i => i.id === itemId ? { ...i, ...patch } : i) } : a);
    setV({ ...v, ambientes });
    if (supabaseReady) { const it = ambientes.find(a=>a.id===ambId).itens.find(i=>i.id===itemId);
      salvar("itens", it).catch(()=>{}); }
  }
  function addAmbiente() {
    const novo = { id: crypto.randomUUID(), vistoria_id: v.id, nome: "Novo ambiente",
      complemento: "", ordem: v.ambientes.length, itens: [] };
    setV({ ...v, ambientes: [...v.ambientes, novo] }); setAberto(novo.id);
    if (supabaseReady) salvar("ambientes", { ...novo, itens: undefined }).catch(()=>{});
  }
  function addItem(ambId) {
    const amb = v.ambientes.find(a => a.id === ambId);
    const novo = { id: crypto.randomUUID(), ambiente_id: ambId, nome: "Novo item",
      estado: "Bom", cor_material: "", observacao: "", divergencia: false, ordem: amb.itens.length };
    const ambientes = v.ambientes.map(a => a.id === ambId ? { ...a, itens: [...a.itens, novo] } : a);
    setV({ ...v, ambientes });
    if (supabaseReady) salvar("itens", novo).catch(()=>{});
  }
  async function onFoto(e, ambId) {
    const file = e.target.files?.[0]; if (!file) return;
    const amb = v.ambientes.map(a => a.id === ambId ? { ...a, fotos: (a.fotos||0)+1 } : a);
    setV({ ...v, ambientes: amb });
    if (supabaseReady) { try { await enviarFoto(v.id, file); } catch {} }
  }

  return (
    <div>
      <PageHeader title={`Vistoria ${v.codigo}`} right={
        <Btn kind="gold" icon={FileText} onClick={() => gerarLaudoPDF(v)}>Gerar laudo (PDF)</Btn>} />
      <Card>
        <button onClick={() => nav("/vistorias")} style={{ background: "none", border: "none",
          color: C.green, cursor: "pointer", fontWeight: 700, display: "flex", gap: 6,
          alignItems: "center", marginBottom: 16 }}><ArrowLeft size={16} /> Voltar para vistorias</button>

        <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginBottom: 20,
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <Field label="Imóvel" w={4}><div style={{ fontWeight: 600, fontSize: 13 }}>{v.imovel?.endereco}</div></Field>
          <Field label="Situação"><div>{situacaoBadge(v.situacao)} <span style={{ marginLeft: 6 }}>{v.tipo?.nome}</span></div></Field>
          <Field label="Vistoriador"><div style={{ fontSize: 13 }}>{v.vistoriador?.nome}</div></Field>
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <Chip icon={Building2} label="Ambientes" value={v.ambientes.length} />
          <Chip icon={ListChecks} label="Itens" value={v.ambientes.reduce((a,x)=>a+x.itens.length,0)} />
          <Chip icon={AlertTriangle} label="Divergências" value={totalDiv} alert={totalDiv>0} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: C.ink }}>Ambientes</div>
          <Btn kind="soft" icon={Plus} small onClick={addAmbiente}>Adicionar ambiente</Btn>
        </div>

        {v.ambientes.map(amb => (
          <div key={amb.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
            <div onClick={() => setAberto(aberto === amb.id ? null : amb.id)} style={{ padding: "14px 18px",
              background: aberto === amb.id ? C.greenSoft : "#fff", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ChevronRight size={18} style={{ transform: aberto === amb.id ? "rotate(90deg)" : "none",
                  transition: "0.15s", color: C.green }} />
                <div><div style={{ fontWeight: 700, color: C.ink }}>{amb.nome}</div>
                  {amb.complemento && <div style={{ fontSize: 12, color: C.sub }}>{amb.complemento}</div>}</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12, color: C.sub }}>
                <span><Camera size={13} style={{ verticalAlign: -2 }} /> {amb.fotos || 0}</span>
                <span>{amb.itens.length} itens</span>
                {amb.itens.some(i=>i.divergencia) && <Badge color={C.red} soft="#FBE9E7">divergência</Badge>}
              </div>
            </div>

            {aberto === amb.id && (
              <div style={{ padding: 18 }}>
                {amb.itens.map(item => (
                  <div key={item.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14,
                    marginBottom: 10, background: item.divergencia ? "#FFF8F6" : "#fff" }}>
                    <div className="item-grid">
                      <Field label="Item"><input style={inputStyle} value={item.nome}
                        onChange={e=>patchItem(amb.id,item.id,{nome:e.target.value})} /></Field>
                      <Field label="Estado de conservação"><select style={{ ...inputStyle,
                        borderLeft: `4px solid ${estadoCor[item.estado]}` }} value={item.estado}
                        onChange={e=>patchItem(amb.id,item.id,{estado:e.target.value})}>
                        {ESTADOS.map(s=><option key={s}>{s}</option>)}</select></Field>
                      <Field label="Cor / Material"><input style={inputStyle} value={item.cor_material||""}
                        onChange={e=>patchItem(amb.id,item.id,{cor_material:e.target.value})} placeholder="ex.: Branco gelo" /></Field>
                    </div>
                    <div style={{ marginTop: 10 }}><Field label="Observação"><input style={inputStyle}
                      value={item.observacao||""} onChange={e=>patchItem(amb.id,item.id,{observacao:e.target.value})} /></Field></div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer",
                        fontWeight: 600, color: item.divergencia ? C.red : C.sub }}>
                        <input type="checkbox" checked={item.divergencia}
                          onChange={e=>patchItem(amb.id,item.id,{divergencia:e.target.checked})} />
                        <AlertTriangle size={15} /> Marcar como divergência</label>
                      {item.divergencia && <Field label="Responsável" w={1}>
                        <select style={inputStyle} value={item.responsavel||"Locatário"}
                          onChange={e=>patchItem(amb.id,item.id,{responsavel:e.target.value})}>
                          {["Locatário","Proprietário","Ambos"].map(r=><option key={r}>{r}</option>)}</select></Field>}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn kind="ghost" icon={Plus} small onClick={()=>addItem(amb.id)}>Adicionar item</Btn>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13,
                    color: C.green, cursor: "pointer", fontWeight: 700 }}>
                    <Camera size={16} /> Anexar fotos
                    <input type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                      onChange={e=>onFoto(e, amb.id)} /></label>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Chip({ icon: Icon, label, value, alert }) {
  return <div style={{ background: alert ? "#FBE9E7" : C.greenSoft, color: alert ? C.red : C.green,
    borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
    <Icon size={18} /><div><div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.85 }}>{label}</div></div></div>;
}
