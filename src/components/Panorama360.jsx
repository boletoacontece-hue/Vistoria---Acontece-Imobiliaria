import React, { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { X, MapPin, Trash2, Plus } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { supabase, supabaseReady } from "../lib/supabase";

// ícone HTML do marcador conforme o tipo
function markerHtml(tipo) {
  const cor = tipo === "avaria" ? "#DC2626" : "#2E7DB0";
  const sym = tipo === "avaria" ? "!" : "i";
  return `<div style="width:26px;height:26px;border-radius:50%;background:${cor};
    border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;font-weight:800;
    display:flex;align-items:center;justify-content:center;font-family:${FONT};font-size:15px">${sym}</div>`;
}

// Visualizador 360° com marcadores. Props:
//  path (Storage privado) OU url (direto) · marcadores · editavel · onChange · onClose
export default function Panorama360({ path, url: urlDireta, marcadores = [], editavel, onChange, onClose }) {
  const host = useRef(null);
  const viewerRef = useRef(null);
  const pluginRef = useRef(null);
  const [url, setUrl] = useState(urlDireta || null);
  const [addMode, setAddMode] = useState(false);
  const [sel, setSel] = useState(null);       // marcador selecionado (para editar)
  const [lista, setLista] = useState(marcadores);
  const addModeRef = useRef(false);
  useEffect(() => { addModeRef.current = addMode; }, [addMode]);

  // resolve URL assinada quando vem do Storage privado
  useEffect(() => {
    if (urlDireta) { setUrl(urlDireta); return; }
    if (path && path.startsWith("http")) { setUrl(path); return; }
    if (path && supabaseReady) {
      supabase.storage.from("vistorias").createSignedUrl(path, 3600)
        .then(({ data }) => setUrl(data?.signedUrl || null));
    }
  }, [path, urlDireta]);

  // instancia o viewer
  useEffect(() => {
    if (!url || !host.current) return;
    const viewer = new Viewer({
      container: host.current, panorama: url,
      navbar: ["zoom", "move", "fullscreen"],
      defaultZoomLvl: 20,
      plugins: [[MarkersPlugin, {}]],
    });
    const plugin = viewer.getPlugin(MarkersPlugin);
    viewerRef.current = viewer; pluginRef.current = plugin;

    // desenha marcadores existentes
    lista.forEach(m => plugin.addMarker({
      id: m.id, position: { yaw: m.yaw, pitch: m.pitch },
      html: markerHtml(m.tipo), anchor: "center center",
      tooltip: m.texto || (m.tipo === "avaria" ? "Avaria" : "Observação"),
    }));

    // clique: em modo adicionar, cria marcador na posição
    viewer.addEventListener("click", ({ data }) => {
      if (!editavel || !addModeRef.current) return;
      const novo = { id: crypto.randomUUID(), yaw: data.yaw, pitch: data.pitch, tipo: "avaria", texto: "" };
      plugin.addMarker({ id: novo.id, position: { yaw: novo.yaw, pitch: novo.pitch },
        html: markerHtml(novo.tipo), anchor: "center center", tooltip: "Avaria" });
      setLista(prev => { const l = [...prev, novo]; onChange && onChange(l); return l; });
      setAddMode(false); setSel(novo);
    });

    // seleciona marcador para editar
    plugin.addEventListener("select-marker", ({ marker }) => {
      setSel(lista.find(x => x.id === marker.id) || { id: marker.id, tipo: "avaria", texto: "" });
    });

    return () => viewer.destroy();
    // eslint-disable-next-line
  }, [url]);

  function atualizar(patch) {
    const novo = { ...sel, ...patch };
    setSel(novo);
    setLista(prev => {
      const l = prev.map(m => m.id === novo.id ? novo : m);
      onChange && onChange(l);
      return l;
    });
    const pl = pluginRef.current;
    if (pl) pl.updateMarker({ id: novo.id, html: markerHtml(novo.tipo),
      tooltip: novo.texto || (novo.tipo === "avaria" ? "Avaria" : "Observação") });
  }
  function excluir() {
    pluginRef.current?.removeMarker(sel.id);
    setLista(prev => { const l = prev.filter(m => m.id !== sel.id); onChange && onChange(l); return l; });
    setSel(null);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px",
        background: C.greenDark, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}><MapPin size={18} /> Vistoria 360°</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {editavel && <button onClick={() => { setAddMode(a => !a); setSel(null); }} style={{
            background: addMode ? C.gold : "rgba(255,255,255,0.15)", color: "#fff", border: "none",
            borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", gap: 6, alignItems: "center", fontFamily: FONT }}>
            <Plus size={15} /> {addMode ? "Clique no ponto da avaria…" : "Marcar avaria"}</button>}
          <X size={24} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <div ref={host} style={{ width: "100%", height: "100%" }} />
        {!url && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}>Carregando panorama…</div>}

        {/* painel de edição do marcador */}
        {sel && editavel && (
          <div style={{ position: "absolute", right: 16, bottom: 16, width: 260, background: "#fff",
            borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: C.ink }}>Marcador</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>Tipo</div>
            <select value={sel.tipo} onChange={e => atualizar({ tipo: e.target.value })}
              style={{ width: "100%", padding: 8, border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 10, fontFamily: FONT }}>
              <option value="avaria">Avaria</option><option value="observacao">Observação</option></select>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>Descrição</div>
            <textarea value={sel.texto || ""} onChange={e => atualizar({ texto: e.target.value })} rows={3}
              style={{ width: "100%", padding: 8, border: `1px solid ${C.line}`, borderRadius: 8, fontFamily: FONT, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={excluir} style={{ background: "none", border: "none", color: C.red, cursor: "pointer",
                display: "flex", gap: 6, alignItems: "center", fontWeight: 700, fontSize: 13, fontFamily: FONT }}>
                <Trash2 size={15} /> Excluir</button>
              <button onClick={() => setSel(null)} style={{ background: C.green, color: "#fff", border: "none",
                borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Ok</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
