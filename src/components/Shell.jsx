import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, CalendarDays, Building2, Users,
  ListChecks, Bell, Maximize2, ChevronDown, WifiOff, RefreshCw, LogOut, Menu, X } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { online, pendentes, sincronizar } from "../lib/sync";
import { useIsMobile } from "../lib/useIsMobile";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vistorias", label: "Vistorias", icon: ClipboardCheck },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/imoveis", label: "Imóveis", icon: Building2 },
  { to: "/locadores", label: "Locadores", icon: Users },
  { to: "/tipos", label: "Tipos de vistoria", icon: ListChecks },
  { to: "/vistoriadores", label: "Vistoriadores", icon: Users },
];

export default function Shell() {
  const { profile, sair } = useAuth();
  const isMobile = useIsMobile();
  const [pend, setPend] = useState(0);
  const [off, setOff] = useState(!online());
  const [menuAberto, setMenuAberto] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const t = setInterval(async () => { setPend(await pendentes()); setOff(!online()); }, 3000);
    return () => clearInterval(t);
  }, []);

  // estilo da barra lateral: fixa no desktop, drawer deslizante no celular
  const asideStyle = isMobile
    ? { position: "fixed", top: 0, left: 0, bottom: 0, width: 250, zIndex: 60,
        transform: drawer ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease",
        background: C.greenDark, color: "#fff", overflowY: "auto" }
    : { width: 232, background: C.greenDark, color: "#fff", flexShrink: 0 };

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink, display: "flex" }}>
      {/* backdrop do drawer no mobile */}
      {isMobile && drawer && <div onClick={() => setDrawer(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 55 }} />}

      <aside style={asideStyle}>
        <div style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ width: 40, height: 40, background: "#fff", borderRadius: 9,
            display: "grid", placeItems: "center", flexShrink: 0 }}>
            <img src={`${import.meta.env.BASE_URL}logo-symbol.png`} alt="Acontece"
              style={{ width: 28, height: 28, objectFit: "contain" }} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>ACONTECE</div>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.5 }}>VISTORIAS</div></div>
          {isMobile && <X size={22} style={{ cursor: "pointer" }} onClick={() => setDrawer(false)} />}
        </div>
        <nav style={{ padding: "14px 12px" }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setDrawer(false)}
              style={({ isActive }) => ({
                display: "flex", gap: 12, alignItems: "center", padding: "12px 14px",
                borderRadius: 9, marginBottom: 3, fontSize: 14, textDecoration: "none", color: "#fff",
                background: isActive ? C.green : "transparent", fontWeight: isActive ? 700 : 500 })}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "12px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          {/* esquerda: hambúrguer no mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && <Menu size={24} color={C.green} style={{ cursor: "pointer" }} onClick={() => setDrawer(true)} />}
          </div>
          {/* direita: status + usuário */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {off && <span style={{ display: "flex", gap: 6, alignItems: "center", color: C.amber,
              fontSize: 12, fontWeight: 700 }}><WifiOff size={15} /> {!isMobile && "Offline"}</span>}
            {pend > 0 && <button onClick={() => sincronizar()} style={{ display: "flex", gap: 6, alignItems: "center",
              background: C.goldSoft, color: "#8a6d00", border: "none", borderRadius: 8, padding: "5px 10px",
              fontSize: 12, fontWeight: 700, cursor: "pointer" }}><RefreshCw size={14} /> {pend}{!isMobile && " p/ sincronizar"}</button>}
            {!isMobile && <Maximize2 size={18} color={C.sub} style={{ cursor: "pointer" }} />}
            {!isMobile && <Bell size={18} color={C.sub} style={{ cursor: "pointer" }} />}
            <div style={{ position: "relative" }}>
              <div onClick={() => setMenuAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.greenSoft, color: C.green,
                  display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
                  {(profile?.nome || "A")[0].toUpperCase()}</div>
                {!isMobile && <span style={{ fontSize: 13, fontWeight: 600 }}>{profile?.nome || "comercial2"}</span>}
                <ChevronDown size={15} color={C.sub} />
              </div>
              {menuAberto && (
                <>
                  <div onClick={() => setMenuAberto(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
                  <div style={{ position: "absolute", right: 0, top: 42, background: "#fff", border: `1px solid ${C.line}`,
                    borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", width: 210, zIndex: 40, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{profile?.nome || "comercial2"}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{profile?.email || ""}</div>
                      {profile?.papel && <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginTop: 2,
                        textTransform: "capitalize" }}>{profile.papel}</div>}
                    </div>
                    <div onClick={sair} style={{ padding: "11px 14px", display: "flex", gap: 10, alignItems: "center",
                      fontSize: 13, cursor: "pointer", color: C.red, fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FBE9E7"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      <LogOut size={15} /> Sair</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="app-main" style={{ padding: 26, maxWidth: 1280, margin: "0 auto" }}><Outlet /></main>
      </div>
    </div>
  );
}
