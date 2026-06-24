// Dados de demonstração usados quando o Supabase ainda não está configurado.
export const DEMO_VISTORIAS = [
  { id: "d1", codigo: 2181751, situacao: "Nova", contestacao: "Sem contestação", data_vistoria: "2026-06-17",
    imovel: { endereco: "2711 - SQNW 311 BLOCO D, APTO 513 B, NOROESTE - BRASÍLIA-DF" },
    tipo: { nome: "Entrada" }, vistoriador: { nome: "Leomar Caetano" } },
  { id: "d2", codigo: 2180115, situacao: "Concluída", contestacao: "Pendente", data_vistoria: "2026-06-16",
    imovel: { endereco: "5229 - SQN 216 BLOCO G APTO 413, BAHAMAS, ASA NORTE - BRASÍLIA-DF" },
    tipo: { nome: "Saída" }, vistoriador: { nome: "Katia de Souza F." } },
  { id: "d3", codigo: 2180113, situacao: "Contestada", contestacao: "Contestada", data_vistoria: "2026-06-16",
    imovel: { endereco: "3532 - SHIN CA 08 LOTE 01 TORRE 05, APTO 107, PREMIER, LAGO NORTE - BRASÍLIA-DF" },
    tipo: { nome: "Saída" }, vistoriador: { nome: "Katia de Souza F." } },
];
export const DEMO_DETALHE = {
  ...DEMO_VISTORIAS[0],
  ambientes: [
    { id: "a1", nome: "Sala", complemento: "Sala de estar/jantar", ordem: 0, itens: [
      { id: "i1", nome: "Piso", estado: "Bom", cor_material: "Porcelanato bege", observacao: "Sem avarias.", divergencia: false, ordem: 0 },
      { id: "i2", nome: "Parede", estado: "Regular", cor_material: "Branco gelo", observacao: "Marcas no interruptor.", divergencia: true, responsavel: "Locatário", ordem: 1 },
    ]},
    { id: "a2", nome: "Cozinha", complemento: "", ordem: 1, itens: [
      { id: "i3", nome: "Bancada", estado: "Bom", cor_material: "Granito preto", observacao: "", divergencia: false, ordem: 0 },
    ]},
  ],
  assinaturas: [{ tipo: "Locador" }, { tipo: "Locatário" }],
};
export const DEMO_IMOVEIS = [
  { codigo_externo: "4315", endereco: "2ª AVENIDA BLOCO 275A, LOJA 02, NÚCLEO BANDEIRANTE - BRASÍLIA-DF", ativo: true },
  { codigo_externo: "4104", endereco: "SQS 109 BLOCO C APTO 505, ASA SUL - BRASÍLIA-DF", ativo: true },
];
export const DEMO_LOCADORES = [
  { nome: "ACONTECE ASS. E PLANEJ. IMOBILIÁRIO LTDA", cpf_cnpj: "67.287.876/0001-31" },
  { nome: "ABADIA ROCHA DO AMARAL", cpf_cnpj: "120.104.991-15" },
];
export const DEMO_TIPOS = ["Captação Avaliação","Entrada","Faxina (Limpeza)","Manutenção/Reparos","Reforma","Saída"]
  .map(n => ({ nome: n, ativo: true }));
