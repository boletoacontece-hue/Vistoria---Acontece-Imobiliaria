import React, { useEffect, useState } from "react";
import { Plus, X, Pencil, ShieldCheck } from "lucide-react";
import { C, FONT } from "../lib/theme";
import { PageHeader, Card, Btn, inputStyle, Field } from "../components/ui";
import { supabase, supabaseReady, clienteEfemero } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const MODULOS = [
  ["dashboard", "Dashboard"], ["vistorias", "Vistorias"], ["agenda", "Agenda"],
  ["imoveis", "Imóveis"], ["locadores", "Locadores"], ["tipos", "Tipos de vistoria"],
  ["vistoriadores", "Vistoriadores"], ["usuarios", "Usuários"],
];
const PAPEIS = ["admin", "comercial", "vistoriador"];

export default function Usuarios() {
  const { papel } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [aviso, setAviso] = useState("");

  async function carregar() {
    if (!supabaseReady) return;
    const { data, error } = await supabase.from("profiles")
      .select("id, nome, email, papel, ativo, permissoes").order("nome");
    if (error) setAviso(error.message); else setRows(data || []);
  }
  useEffect(() => { carregar(); }, []);

  if (papel !== "admin")
    return <div><PageHeader title="Usuários" /><Card>Acesso restrito a administradores.</Card></div>;

  return (
    <div>
      <PageHeader title="Usuários" right={<Btn kind="gold" icon={Plus} onClick={() => setModal({ novo: true })}>Novo usuário</Btn>} />
      <Card>
        {aviso && <div style={{ background: "#FBE9E7", color: C.red, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{aviso}</div>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.line}`, color: C.sub, textAlign: "left" }}>
            {["Nome", "E-mail", "Papel", "Ativo", ""].map(h => <th key={h} style={{ padding: "10px 8px", fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: C.sub }}>Nenhum usuário.</td></tr>}
            {rows.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>{u.nome}</td>
                <td style={{ padding: "12px 8px" }}>{u.email}</td>
                <td style={{ padding: "12px 8px", textTransform: "capitalize" }}>
                  {u.papel === "admin" && <ShieldCheck size={13} style={{ verticalAlign: -2, color: C.gold, marginRight: 4 }} />}{u.papel}</td>
                <td style={{ padding: "12px 8px" }}>{u.ativo ? "Sim" : "Não"}</td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <Pencil size={16} style={{ color: C.sub, cursor: "pointer" }} onClick={() => setModal(u)} /></td>
              </tr>))}
          </tbody>
        </table>
      </Card>

      {modal && <UsuarioModal usuario={modal} onClose={() => setModal(null)} onSalvo={() => { setModal(null); carregar(); }} />}
    </div>
  );
}

function UsuarioModal({ usuario, onClose, onSalvo }) {
  const novo = !!usuario.novo;
  const [f, setF] = useState({
    nome: usuario.nome || "", email: usuario.email || "", senha: "",
    papel: usuario.papel || "comercial", ativo: usuario.ativo ?? true,
    permissoes: usuario.permissoes || {},
  });
  const [erro, setErro] = useState(""); const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const togglePerm = (m) => setF(s => ({ ...s, permissoes: { ...s.permissoes, [m]: !s.permissoes[m] } }));
  const admin = f.papel === "admin";

  async function salvar() {
    if (novo && (!f.email || !f.senha)) return setErro("E-mail e senha são obrigatórios.");
    if (novo && f.senha.length < 6) return setErro("A senha precisa de ao menos 6 caracteres.");
    setErro(""); setSalvando(true);
    try {
      const perfil = { nome: f.nome, papel: f.papel, ativo: f.ativo, permissoes: f.permissoes };
      if (novo) {
        // cria o usuário no Auth via cliente efêmero (não desloga o admin)
        const tmp = clienteEfemero();
        const { data, error } = await tmp.auth.signUp({ email: f.email, password: f.senha, options: { data: { nome: f.nome } } });
        if (error) throw error;
        const id = data.user?.id;
        if (!id) throw new Error("Não foi possível criar o usuário.");
        // grava o perfil (o gatilho pode já ter criado; upsert cobre os dois casos)
        const { error: e2 } = await supabase.from("profiles").upsert({ id, email: f.email, ...perfil });
        if (e2) throw e2;
      } else {
        const { error } = await supabase.from("profiles").update(perfil).eq("id", usuario.id);
        if (error) throw error;
      }
      onSalvo();
    } catch (e) { setErro(e.message || "Erro ao salvar."); setSalvando(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,31,20,0.5)",
      display: "grid", placeItems: "center", zIndex: 100, fontFamily: FONT, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 560,
        maxWidth: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: C.green, color: "#fff", padding: "16px 22px", display: "flex",
          justifyContent: "space-between", alignItems: "center", borderRadius: "14px 14px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{novo ? "Novo usuário" : "Editar usuário"}</h3>
          <X size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ padding: 22, display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Field label="Nome" w={2}><input style={inputStyle} value={f.nome} onChange={e => set("nome", e.target.value)} /></Field>
          <Field label="E-mail *" w={2}><input style={inputStyle} value={f.email} disabled={!novo}
            onChange={e => set("email", e.target.value)} /></Field>
          {novo && <Field label="Senha provisória *" w={2}><input type="text" style={inputStyle} value={f.senha}
            placeholder="mín. 6 caracteres" onChange={e => set("senha", e.target.value)} /></Field>}
          <Field label="Papel" w={2}><select style={inputStyle} value={f.papel} onChange={e => set("papel", e.target.value)}>
            {PAPEIS.map(p => <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p}</option>)}</select></Field>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 18, cursor: "pointer" }}>
            <input type="checkbox" checked={f.ativo} onChange={e => set("ativo", e.target.checked)} /> Usuário ativo</label>

          <div style={{ width: "100%" }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "6px 0 8px" }}>
              Permissões por módulo {admin && <span style={{ color: C.gold }}>(admin acessa tudo)</span>}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
              {MODULOS.map(([k, label]) => (
                <label key={k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, cursor: admin ? "default" : "pointer",
                  opacity: admin ? 0.6 : 1 }}>
                  <input type="checkbox" disabled={admin} checked={admin || !!f.permissoes[k]} onChange={() => togglePerm(k)} /> {label}
                </label>))}
            </div>
          </div>
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
