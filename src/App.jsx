import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Vistorias from "./screens/Vistorias";
import Editor from "./screens/Editor";
import Agenda from "./screens/Agenda";
import { Imoveis, Locadores, Tipos } from "./screens/Cadastros";

function Protegido() {
  const { user, loading, supabaseReady } = useAuth();
  if (loading) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Carregando…</div>;
  // Sem Supabase configurado, libera a demonstração direto
  if (!user && supabaseReady) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="vistorias" element={<Vistorias />} />
        <Route path="vistorias/:id" element={<Editor />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="imoveis" element={<Imoveis />} />
        <Route path="locadores" element={<Locadores />} />
        <Route path="tipos" element={<Tipos />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider><Protegido /></AuthProvider>
    </HashRouter>
  );
}
