import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ChevronRight, Camera, AlertTriangle, FileText,
  Building2, ListChecks, Orbit, ExternalLink, X, MapPin } from "lucide-react";
import { C, ESTADOS, estadoCor } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle, situacaoBadge, Badge } from "../components/ui";
import { carregarVistoria, salvar, enviarFoto, enviarPanorama } from "../lib/vistoriasService";
import Panorama360 from "../components/Panorama360";
import { supabase, supabaseReady } from "../lib/supabase";
import { DEMO_DETALHE } from "../lib/demo";
import { gerarLaudoPDF } from "../lib/pdf";

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [tour360, setTour360] = useState(false);
  const [pano, setPano] = useState(null);
  const [erroCarga, setErroCarga] = useState("");

  useEffect(() => {
    if (!supabaseReady) { setV(DEMO_DETALHE); setAberto(DEMO_DETALHE.ambientes[0]?.id); return; }
    carregarVistoria(id).then(d => { setV(d); setAberto(d.ambientes?.[0]?.id); })
      .catch((e) => setErroCarga(e.message || "Vistoria não encontrada."));
  }, [id]);

  const totalDiv = useMemo(() =>
    v?.ambientes?.reduce((a, amb) => a + amb.itens.filter(i => i.divergencia).length, 0) || 0, [v]);

  if (erroCarga) return <div style={{ padding: 40, color: C.red }}>Não foi possível abrir a vistoria: {erroCarga}</div>;
  if (!v) return <div style={{ padding: 40 }}>Carregando…</div>;

  // Atualiza campos escalares da vistoria (ex.: link do tour 360°) e persiste
  function patchVistoria(patch) {
    setV(cur => ({ ...cur, ...patch }));
    if (supabaseReady) supabase.from("vistorias").update(patch).eq("id", v.id).then(() => {});
  }

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

  // envia a foto 360° do ambiente e grava o caminho
  async function onPanorama(e, ambId) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!supabaseReady) { alert("Configure o Supabase para enviar o panorama."); return; }
    try {
      const path = await enviarPanorama(v.id, ambId, file);
      const ambientes = v.ambientes.map(a => a.id === ambId ? { ...a, panorama_path: path } : a);
      setV({ ...v, ambientes });
      await supabase.from("ambientes").update({ panorama_path: path }).eq("id", ambId);
    } catch (err) { alert("Falha ao enviar 360°: " + err.message); }
  }

  // persiste os marcadores do 360° de um ambiente
  function salvarMarcadores(ambId, marcadores) {
    const ambientes = v.ambientes.map(a => a.id === ambId ? { ...a, marcadores } : a);
    setV({ ...v, ambientes });
    if (supabaseReady) supabase.from("ambientes").update({ marcadores }).eq("id", ambId).then(() => {});
  }

  return (
    <div>
      <PageHeader title={`Vistoria ${v.codigo}`} right={
        <div style={{ display: "flex", gap: 10 }}>
          {v.tour_360_url && <Btn kind="ghost" icon={Orbit} onClick={() => setTour360(true)}>Vistoria em 360°</Btn>}
          <Btn kind="gold" icon={FileText} onClick={() => gerarLaudoPDF(v)}>Gerar laudo (PDF)</Btn>
        </div>} />
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

        <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 20,
          display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Tour 360° — link do HVR360 (cola aqui o endereço do tour)" w={4}>
            <input style={inputStyle} value={v.tour_360_url || ""} placeholder="https://ws.hvr360.net/tourvirtual/vistoria/..."
              onChange={e => patchVistoria({ tour_360_url: e.target.value })} /></Field>
          <Btn kind="ghost" icon={Orbit} onClick={() => v.tour_360_url && setTour360(true)}>Abrir 360°</Btn>
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
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Btn kind="ghost" icon={Plus} small onClick={()=>addItem(amb.id)}>Adicionar item</Btn>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13,
                    color: C.green, cursor: "pointer", fontWeight: 700 }}>
                    <Camera size={16} /> Anexar fotos
                    <input type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                      onChange={e=>onFoto(e, amb.id)} /></label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13,
                    color: C.green, cursor: "pointer", fontWeight: 700 }}>
                    <MapPin size={16} /> {amb.panorama_path ? "Trocar 360°" : "Enviar foto 360°"}
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e=>onPanorama(e, amb.id)} /></label>
                  {amb.panorama_path && <Btn kind="soft" icon={MapPin} small onClick={()=>setPano(amb.id)}>
                    Abrir 360° {amb.marcadores?.length ? `(${amb.marcadores.length})` : ""}</Btn>}
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {tour360 && v.tour_360_url && <Tour360 url={v.tour_360_url} onClose={() => setTour360(false)} />}

      {pano && (() => {
        const amb = v.ambientes.find(a => a.id === pano);
        if (!amb) return null;
        return <Panorama360 path={amb.panorama_path} marcadores={amb.marcadores || []} editavel
          onChange={(m) => salvarMarcadores(amb.id, m)} onClose={() => setPano(null)} />;
      })()}
    </div>
  );
}

// Visualizador do tour 360° embutido (iframe). O HVR360 permite integração via IFRAME.
function Tour360({ url, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.9)", zIndex: 200,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 18px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <Orbit size={18} /> Vistoria em 360°
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#fff", fontSize: 13,
            display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={15} /> Abrir em nova aba</a>
          <X size={24} style={{ cursor: "pointer", color: "#fff" }} onClick={onClose} />
        </div>
      </div>
      <iframe title="Tour 360°" src={url} allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        style={{ flex: 1, border: "none", width: "100%", background: "#000" }} />
    </div>
  );
}

function Chip({ icon: Icon, label, value, alert }) {
  return <div style={{ background: alert ? "#FBE9E7" : C.greenSoft, color: alert ? C.red : C.green,
    borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
    <Icon size={18} /><div><div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.85 }}>{label}</div></div></div>;
}
