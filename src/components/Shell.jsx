import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, CalendarDays, Building2, Users,
  ListChecks, Settings, Bell, Maximize2, ChevronDown, WifiOff, RefreshCw } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { online, pendentes, sincronizar } from "../lib/sync";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vistorias", label: "Vistorias", icon: ClipboardCheck },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/imoveis", label: "Imóveis", icon: Building2 },
  { to: "/locadores", label: "Locadores", icon: Users },
  { to: "/tipos", label: "Tipos de vistoria", icon: ListChecks },
];

export default function Shell() {
  const { profile, sair } = useAuth();
  const nav = useNavigate();
  const [pend, setPend] = useState(0);
  const [off, setOff] = useState(!online());

  useEffect(() => {
    const t = setInterval(async () => { setPend(await pendentes()); setOff(!online()); }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink, display: "flex" }}>
      <aside style={{ width: 232, background: C.greenDark, color: "#fff", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ width: 40, height: 40, background: "#fff", borderRadius: 9,
            display: "grid", placeItems: "center", flexShrink: 0 }}>
            <img src={`${import.meta.env.BASE_URL}logo-symbol.png`} alt="Acontece"
              style={{ width: 28, height: 28, objectFit: "contain" }} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>ACONTECE</div>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.5 }}>VISTORIAS</div></div>
        </div>
        <nav style={{ padding: "14px 12px" }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} style={({isActive}) => ({
              display: "flex", gap: 12, alignItems: "center", padding: "11px 14px",
              borderRadius: 9, marginBottom: 3, fontSize: 13, textDecoration: "none", color: "#fff",
              background: isActive ? C.green : "transparent", fontWeight: isActive ? 700 : 500 })}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "12px 26px",
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 18 }}>
          {off && <span style={{ display: "flex", gap: 6, alignItems: "center", color: C.amber,
            fontSize: 12, fontWeight: 700 }}><WifiOff size={15} /> Offline</span>}
          {pend > 0 && <button onClick={()=>sincronizar()} style={{ display: "flex", gap: 6, alignItems: "center",
            background: C.goldSoft, color: "#8a6d00", border: "none", borderRadius: 8, padding: "5px 10px",
            fontSize: 12, fontWeight: 700, cursor: "pointer" }}><RefreshCw size={14} /> {pend} p/ sincronizar</button>}
          <Maximize2 size={18} color={C.sub} style={{ cursor: "pointer" }} />
          <Bell size={18} color={C.sub} style={{ cursor: "pointer" }} />
          <div onClick={sair} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} title="Sair">
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.greenSoft, color: C.green,
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
              {(profile?.nome || "A")[0].toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{profile?.nome || "comercial2"}</span>
            <ChevronDown size={15} color={C.sub} />
          </div>
        </header>
        <main style={{ padding: 26, maxWidth: 1280, margin: "0 auto" }}><Outlet /></main>
      </div>
    </div>
  );
}
