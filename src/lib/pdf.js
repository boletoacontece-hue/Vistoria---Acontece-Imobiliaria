import { jsPDF } from "jspdf";

async function carregarLogo() {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}logo-acontece.png`);
    const blob = await resp.blob();
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  } catch { return null; }
}

const ESTADO_FRASE = {
  "Novo": "novo(a) e em perfeito estado", "Ótimo": "em perfeito estado", "Bom": "em bom estado",
  "Regular": "em estado regular", "Ruim": "em estado ruim, com desgaste", "Péssimo": "em péssimo estado",
};
const MEDIDORES = [["agua","Água"],["energia","Energia"],["energia2","Energia 2"],["agua_quente","Água quente"],["gas","Gás"]];
const dataBR = (d) => d ? d.split("-").reverse().join("/") : "—";

export async function gerarLaudoPDF(v) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, LW = W - 2 * M;
  let y = 14;
  const GREEN = [43, 92, 43], GOLD = [201, 162, 39], INK = [30, 30, 30], SUB = [90, 90, 90];

  const nl = (h = 5.2) => { y += h; if (y > 276) { doc.addPage(); y = 18; } };
  const rule = (col = GREEN, w = 0.5) => { doc.setDrawColor(...col); doc.setLineWidth(w); doc.line(M, y, W - M, y); };
  const font = (bold, size, color = INK) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color); };
  const secao = (t) => { nl(3); doc.setFillColor(...GREEN); doc.rect(M, y - 4.2, LW, 7, "F"); font(true, 10.5, [255,255,255]); doc.text(t, M + 3, y + 0.8); nl(9); };
  const campo = (rot, val) => {
    font(true, 9.5, SUB); doc.text(rot, M, y); font(false, 9.5);
    const ls = doc.splitTextToSize(val || "—", LW - 42);
    ls.forEach((l, i) => { doc.text(l, M + 42, y); if (i < ls.length - 1) nl(4.6); }); nl(6);
  };
  const paragrafo = (txt) => {
    font(false, 9.5);
    txt.split("\n").forEach(par => {
      const ls = doc.splitTextToSize(par || " ", LW);
      ls.forEach(l => { doc.text(l, M, y); nl(4.8); });
    });
  };

  // ---------- CABEÇALHO ----------
  const logo = await carregarLogo();
  if (logo) { const lw = 30, lh = lw * 326 / 365; doc.addImage(logo, "PNG", (W - lw) / 2, y, lw, lh); y += lh + 7; }
  font(true, 15, GREEN); doc.text("TERMO DE VISTORIA", W / 2, y, { align: "center" }); nl(6);
  font(false, 9, SUB); doc.text("ACONTECE ASSESSORIA E PLANEJAMENTO IMOBILIÁRIO LTDA", W / 2, y, { align: "center" }); nl(5);
  font(true, 11); doc.text(`Vistoria nº ${v.codigo}`, W / 2, y, { align: "center" }); nl(4);
  rule(GOLD, 0.8); nl(7);

  // realizada por / em — duas colunas sem sobreposição
  font(true, 9.5, SUB); doc.text("REALIZADA POR:", M, y);
  font(false, 9.5); doc.text((v.vistoriador?.nome || "—").toUpperCase(), M + 32, y);
  const xEm = M + LW / 2 + 10;
  font(true, 9.5, SUB); doc.text("REALIZADA EM:", xEm, y);
  font(false, 9.5); doc.text(dataBR(v.data_vistoria), xEm + 30, y);
  nl(4);

  // ---------- DADOS DO IMÓVEL ----------
  secao("DADOS DO IMÓVEL");
  campo("Tipo de vistoria", v.tipo?.nome);
  campo("Faxinado", v.faxinado ? "Sim" : "Não");
  campo("Imóvel", v.imovel?.endereco);
  if (v.imovel?.metragem) campo("Metragem", `${v.imovel.metragem} m²`);
  if (v.chaves) campo("Chaves/Outros", v.chaves);

  // ---------- CABEÇALHO (texto livre) ----------
  if (v.cabecalho) { nl(2); paragrafo(v.cabecalho); nl(2); }

  // ---------- AMBIENTES ----------
  secao("AMBIENTES");
  (v.ambientes || []).forEach(amb => {
    nl(1); font(true, 10.5, GREEN);
    doc.text(`${amb.nome.toUpperCase()}${amb.complemento ? "  —  " + amb.complemento : ""}`, M, y);
    nl(2); rule([210,210,210], 0.3); nl(5);
    (amb.itens || []).forEach(it => {
      let frase = it.cor_material || "";
      const est = ESTADO_FRASE[it.estado] || (it.estado || "").toLowerCase();
      frase += (frase ? " : " : "") + est;
      if (it.observacao) frase += `. (${it.observacao})`;
      font(true, 9.5); const nome = `-  ${it.nome} `; doc.text(nome, M, y);
      const nw = doc.getTextWidth(nome); font(false, 9.5);
      const ls = doc.splitTextToSize(frase, LW - nw);
      ls.forEach((l, i) => { doc.text(l, i === 0 ? M + nw : M + 4, y); if (i < ls.length - 1) nl(4.6); });
      if (it.divergencia) { nl(4.6); font(true, 9, [192,57,43]); doc.text(`   ▲ DIVERGÊNCIA — responsável: ${it.responsavel || "—"}`, M + 4, y); }
      nl(5);
    });
    nl(2);
  });

  // ---------- MEDIDORES ----------
  const med = v.medidores || {};
  const medRows = MEDIDORES.filter(([k]) => med[k] && (med[k].medidor || med[k].leitura));
  if (medRows.length) {
    secao("MEDIDORES");
    medRows.forEach(([k, label]) => {
      const m = med[k];
      campo(label, `Medidor: ${m.medidor || "—"}   ·   Leitura: ${m.leitura || "—"}   ·   ${m.situacao || "Desligado"}`);
    });
  }

  // ---------- OBSERVAÇÃO ----------
  if (v.observacao) { secao("OBSERVAÇÕES"); paragrafo(v.observacao); }

  // ---------- TOUR 360° ----------
  if (v.tour_360_url) {
    nl(2); font(true, 9.5, GREEN); doc.text("Vistoria em 360°: ", M, y);
    const lw2 = doc.getTextWidth("Vistoria em 360°: "); font(false, 9.5, [46,125,176]);
    doc.textWithLink(v.tour_360_url, M + lw2, y, { url: v.tour_360_url }); nl(6);
  }

  // ---------- ASSINATURAS ----------
  const assin = v.assinaturas?.length ? v.assinaturas : [{ tipo: "Locador(a)", nome: "" }, { tipo: "Locatário(a)", nome: "" }];
  if (y > 230) { doc.addPage(); y = 24; } else nl(14);
  const colW = LW / 2;
  assin.forEach((a, i) => {
    const col = i % 2, x = M + col * colW;
    if (col === 0 && i > 0) nl(22);
    if (y > 270) { doc.addPage(); y = 24; }
    doc.setDrawColor(40); doc.setLineWidth(0.4); doc.line(x + 8, y, x + colW - 8, y);
    font(true, 9); doc.text(a.nome || " ", x + colW / 2, y + 5, { align: "center" });
    font(false, 8.5, SUB); doc.text(a.tipo, x + colW / 2, y + 9.5, { align: "center" });
  });

  // rodapé
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); font(false, 8, SUB);
    doc.text(`Vistoria ${v.codigo} — Acontece Assessoria e Planejamento Imobiliário`, M, 290);
    doc.text(`Página ${p} de ${total}`, W - M, 290, { align: "right" });
  }
  doc.save(`termo-vistoria-${v.codigo}.pdf`);
}
