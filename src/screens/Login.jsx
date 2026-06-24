import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { C, FONT } from "../lib/theme";
import { Btn } from "../components/ui";

export default function Login() {
  const { entrar, supabaseReady } = useAuth();
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function submit() {
    setErro("");
    const { error } = await entrar(email, senha);
    if (error) setErro("E-mail ou senha incorretos.");
  }
  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: C.greenDark,
      display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 36, width: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 0, height: 0, borderLeft: "15px solid transparent",
            borderRight: "15px solid transparent", borderBottom: `26px solid ${C.gold}` }} />
          <div><div style={{ fontWeight: 800, fontSize: 20, color: C.green, letterSpacing: 1 }}>ACONTECE</div>
            <div style={{ fontSize: 10, color: C.sub, letterSpacing: 2 }}>VISTORIAS</div></div>
        </div>
        {!supabaseReady && <div style={{ background: C.goldSoft, color: "#8a6d00", padding: 10,
          borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
          Supabase não configurado — entre com qualquer dado para ver a demonstração.</div>}
        <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>E-mail</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={inp} />
        <label style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Senha</label>
        <input type="password" value={senha} onChange={e=>setSenha(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()} style={inp} />
        {erro && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{erro}</div>}
        <div style={{ marginTop: 8 }}><Btn kind="primary" onClick={submit}>Entrar</Btn></div>
      </div>
    </div>
  );
}
const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${C.line}`,
  borderRadius: 8, margin: "5px 0 14px", fontSize: 14, fontFamily: FONT, outline: "none" };
