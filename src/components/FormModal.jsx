import React, { useState } from "react";
import { X } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { Btn, inputStyle } from "./ui";

// Formulário modal genérico, dirigido por config de campos.
// fields: [{ key, label, type, options, required, w, placeholder }]
//   type: "text" | "number" | "select" | "checkbox" | "datetime"
export default function FormModal({ title, fields, initial = {}, onClose, onSubmit }) {
  const [v, setV] = useState(() => {
    const base = {};
    fields.forEach(f => { base[f.key] = initial[f.key] ?? (f.type === "checkbox" ? true : ""); });
    return base;
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function set(k, val) { setV(s => ({ ...s, [k]: val })); }

  async function salvar() {
    for (const f of fields) {
      if (f.required && !v[f.key] && v[f.key] !== false) { setErro(`Preencha: ${f.label}`); return; }
    }
    setErro(""); setSalvando(true);
    try { await onSubmit(v); onClose(); }
    catch (e) { setErro(e?.message || "Erro ao salvar."); setSalvando(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)",
      display: "grid", placeItems: "center", zIndex: 100, fontFamily: FONT, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
        width: 540, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: C.green, color: "#fff", padding: "16px 22px", display: "flex",
          justifyContent: "space-between", alignItems: "center", borderRadius: "14px 14px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <X size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ padding: 22, display: "flex", flexWrap: "wrap", gap: 14 }}>
          {fields.map(f => (
            <div key={f.key} style={{ flex: f.w || 1, minWidth: f.w === 2 ? 240 : 160 }}>
              {f.type !== "checkbox" && <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>
                {f.label}{f.required && <span style={{ color: C.red }}> *</span>}</div>}
              {f.type === "select" ? (
                <select style={inputStyle} value={v[f.key]} onChange={e => set(f.key, e.target.value)}>
                  <option value="">Selecione…</option>
                  {(f.options || []).map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 18, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!v[f.key]} onChange={e => set(f.key, e.target.checked)} /> {f.label}
                </label>
              ) : (
                <input style={inputStyle} type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : "text"}
                  value={v[f.key]} placeholder={f.placeholder || ""} onChange={e => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
          {erro && <div style={{ width: "100%", color: C.red, fontSize: 13 }}>{erro}</div>}
        </div>
        <div style={{ padding: "0 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={salvar}>{salvando ? "Salvando…" : "Salvar"}</Btn>
        </div>
      </div>
    </div>
  );
}
