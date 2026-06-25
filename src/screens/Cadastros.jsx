import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus, Pencil } from "lucide-react";
import { C } from "../lib/theme";
import { PageHeader, Card, Field, Btn, inputStyle } from "../components/ui";
import FormModal from "../components/FormModal";
import { supabase, supabaseReady } from "../lib/supabase";
import { DEMO_IMOVEIS, DEMO_LOCADORES, DEMO_TIPOS } from "../lib/demo";

// Componente genérico de cadastro: lista + pesquisa + Novo/Editar (insert/update reais)
function Cadastro({ titulo, tabela, colunas, campos, busca, demo, ordenar = "criado_em" }) {
  const [rows, setRows] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [modal, setModal] = useState(null); // null | {} (novo) | registro (editar)
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    if (!supabaseReady) { setRows(demo); return; }
    setCarregando(true);
    try {
      let q = supabase.from(tabela).select("*").limit(200);
      // aplica filtros de pesquisa (ilike para texto)
      busca.forEach(b => {
        const val = filtros[b.key];
        if (val) q = q.ilike(b.col || b.key, `%${val}%`);
      });
      try { q = q.order(ordenar, { ascending: false }); } catch {}
      const { data, error } = await q;
      if (error) throw error;
      setRows(data || []);
    } catch (e) { setAviso(e.message); setRows([]); }
    finally { setCarregando(false); }
  }, [tabela, filtros, busca, demo, ordenar]);

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [tabela]);

  async function salvar(valores) {
    if (!supabaseReady) { setAviso("Configure o Supabase para gravar."); return; }
    // converte números
    const payload = { ...valores };
    campos.forEach(c => { if (c.type === "number" && payload[c.key] !== "") payload[c.key] = Number(payload[c.key]); });
    if (modal?.id) payload.id = modal.id; // edição
    const { error } = await supabase.from(tabela).upsert(payload);
    if (error) throw error;
    await carregar();
  }

  return (
    <div>
      <PageHeader title={titulo} />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18, alignItems: "flex-end" }}>
          {busca.map(b => (
            <Field key={b.key} label={b.label}>
              <input style={inputStyle} value={filtros[b.key] || ""}
                onChange={e => setFiltros(f => ({ ...f, [b.key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && carregar()} />
            </Field>
          ))}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <Btn kind="primary" icon={Search} onClick={carregar}>Pesquisar</Btn>
            <Btn kind="gold" icon={Plus} onClick={() => setModal({})}>Novo</Btn>
          </div>
        </div>

        {aviso && <div style={{ background: "#FBE9E7", color: C.red, padding: 10, borderRadius: 8,
          fontSize: 13, marginBottom: 12 }}>{aviso}</div>}

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.line}`, color: C.sub, textAlign: "left" }}>
            {colunas.map(c => <th key={c.key} style={{ padding: "10px 8px", fontSize: 11, textTransform: "uppercase" }}>{c.label}</th>)}
            <th></th></tr></thead>
          <tbody>
            {rows.length === 0 && !carregando && (
              <tr><td colSpan={colunas.length + 1} style={{ padding: 28, textAlign: "center", color: C.sub }}>
                Nenhum registro. Clique em <b>Novo</b> para cadastrar.</td></tr>)}
            {rows.map((r, i) => (
              <tr key={r.id || i} style={{ borderBottom: `1px solid ${C.line}` }}>
                {colunas.map(c => <td key={c.key} style={{ padding: "12px 8px" }}>{c.render ? c.render(r[c.key]) : r[c.key]}</td>)}
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <Pencil size={16} style={{ color: C.sub, cursor: "pointer" }} onClick={() => setModal(r)} /></td>
              </tr>))}
          </tbody>
        </table>
      </Card>

      {modal && <FormModal title={modal.id ? `Editar — ${titulo}` : `Novo — ${titulo}`}
        fields={campos} initial={modal} onClose={() => setModal(null)} onSubmit={salvar} />}
    </div>
  );
}

export function Imoveis() {
  return <Cadastro titulo="Imóvel" tabela="imoveis" demo={DEMO_IMOVEIS}
    busca={[{ key: "codigo_externo", label: "Código externo" }, { key: "endereco", label: "Endereço" },
            { key: "bairro", label: "Bairro" }]}
    colunas={[{ key: "codigo_externo", label: "Código externo" }, { key: "endereco", label: "Endereço" },
              { key: "bairro", label: "Bairro" }, { key: "ativo", label: "Ativo", render: v => v ? "Sim" : "Não" }]}
    campos={[
      { key: "codigo_externo", label: "Código externo", w: 1 },
      { key: "endereco", label: "Endereço", required: true, w: 2 },
      { key: "numero", label: "Número", w: 1 }, { key: "complemento", label: "Complemento", w: 1 },
      { key: "bairro", label: "Bairro", w: 1 }, { key: "cidade", label: "Cidade", w: 1 },
      { key: "uf", label: "UF", w: 1 }, { key: "metragem", label: "Metragem (m²)", type: "number", w: 1 },
      { key: "ativo", label: "Ativo", type: "checkbox", w: 2 },
    ]} />;
}

export function Locadores() {
  return <Cadastro titulo="Locador" tabela="locadores" demo={DEMO_LOCADORES}
    busca={[{ key: "nome", label: "Nome" }, { key: "cpf_cnpj", label: "CPF/CNPJ" }]}
    colunas={[{ key: "nome", label: "Nome" }, { key: "cpf_cnpj", label: "CPF/CNPJ" },
              { key: "ativo", label: "Ativo", render: v => v ? "Sim" : "Não" }]}
    campos={[
      { key: "codigo_externo", label: "Código externo", w: 1 },
      { key: "nome", label: "Nome", required: true, w: 2 },
      { key: "cpf_cnpj", label: "CPF/CNPJ", w: 1 }, { key: "email", label: "E-mail", w: 1 },
      { key: "telefone", label: "Telefone", w: 1 }, { key: "ativo", label: "Ativo", type: "checkbox", w: 2 },
    ]} />;
}

export function Tipos() {
  return <Cadastro titulo="Tipo de vistoria" tabela="tipos_vistoria" demo={DEMO_TIPOS} ordenar="nome"
    busca={[{ key: "nome", label: "Nome" }]}
    colunas={[{ key: "nome", label: "Nome" }, { key: "ativo", label: "Ativo", render: v => v ? "Sim" : "Não" }]}
    campos={[
      { key: "nome", label: "Nome", required: true, w: 2 },
      { key: "texto_padrao", label: "Texto padrão (sai no termo)", w: 2 },
      { key: "usar_como_modelo", label: "Usar como modelo/comparação", type: "checkbox", w: 1 },
      { key: "ativo", label: "Ativo", type: "checkbox", w: 1 },
    ]} />;
}

export function Vistoriadores() {
  return <Cadastro titulo="Vistoriador" tabela="vistoriadores" demo={[]} ordenar="nome"
    busca={[{ key: "nome", label: "Nome" }]}
    colunas={[{ key: "nome", label: "Nome" }, { key: "telefone", label: "Telefone" },
              { key: "ativo", label: "Ativo", render: v => v ? "Sim" : "Não" }]}
    campos={[
      { key: "nome", label: "Nome", required: true, w: 2 },
      { key: "telefone", label: "Telefone", w: 1 },
      { key: "ativo", label: "Ativo", type: "checkbox", w: 1 },
    ]} />;
}
