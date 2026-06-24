import React from "react";
import { C, FONT } from "../lib/theme";

export const inputStyle = {
  width: "100%", padding: "9px 11px", border: `1px solid ${C.line}`,
  borderRadius: 8, fontSize: 13, fontFamily: FONT, background: "#fff",
  color: C.ink, outline: "none",
};

export function Badge({ children, color, soft }) {
  return <span style={{ background: soft, color, border: `1px solid ${color}33`,
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
    textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
}

export function situacaoBadge(s) {
  const map = {
    Nova: [C.green, C.greenSoft], "Em andamento": [C.blue, "#E3F0F7"],
    "Concluída": [C.greenDark, C.greenSoft], Contestada: [C.red, "#FBE9E7"],
    Cancelada: [C.sub, "#EEE"],
  };
  const [color, soft] = map[s] || [C.sub, "#EEE"];
  return <Badge color={color} soft={soft}>{s}</Badge>;
}

export function Btn({ children, kind = "primary", onClick, icon: Icon, small, type }) {
  const styles = {
    primary: { background: C.green, color: "#fff", border: "none" },
    gold: { background: C.gold, color: "#fff", border: "none" },
    ghost: { background: "#fff", color: C.green, border: `1px solid ${C.green}` },
    soft: { background: C.greenSoft, color: C.green, border: "none" },
  };
  return <button type={type} onClick={onClick} style={{ ...styles[kind],
    padding: small ? "7px 12px" : "9px 16px", borderRadius: 8, fontWeight: 700,
    fontSize: 13, fontFamily: FONT, cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 7 }}>{Icon && <Icon size={16} />}{children}</button>;
}

export function Field({ label, children, w }) {
  return <div style={{ flex: w || 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 600 }}>{label}</div>
    {children}</div>;
}

export function PageHeader({ title, right }) {
  return <div style={{ background: C.green, borderRadius: "14px 14px 0 0",
    padding: "20px 26px", color: "#fff", display: "flex",
    justifyContent: "space-between", alignItems: "center" }}>
    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>{right}</div>;
}

export function Card({ children }) {
  return <div style={{ background: C.card, borderRadius: "0 0 14px 14px",
    padding: 26, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>{children}</div>;
}

export function KpiCard({ value, sub, label, icon: Icon }) {
  return <div style={{ background: C.green, color: "#fff", borderRadius: 14,
    padding: "20px 22px", display: "flex", justifyContent: "space-between",
    alignItems: "center", boxShadow: "0 2px 8px rgba(43,92,43,0.18)" }}>
    <div><div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, opacity: 0.92, marginTop: 6 }}>{label}
        {sub && <span style={{ opacity: 0.7, fontWeight: 400 }}> {sub}</span>}</div></div>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.16)",
      display: "grid", placeItems: "center" }}><Icon size={24} /></div></div>;
}
