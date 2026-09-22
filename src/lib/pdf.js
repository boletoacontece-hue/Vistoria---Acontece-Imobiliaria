import { jsPDF } from "jspdf";

// Carrega a logo (em /public) como dataURL para embutir no PDF
async function carregarLogo() {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}logo-acontece.png`);
    const blob = await resp.blob();
    return await new Promise((res) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob);
    });
  } catch { return null; }
}

// Estado de conservação → frase no padrão do termo Acontece
const ESTADO_FRASE = {
  "Novo": "novo(a) e em perfeito estado",
  "Ótimo": "em perfeito estado",
  "Bom": "em bom estado",
  "Regular": "em estado regular",
  "Ruim": "em estado ruim, com desgaste",
  "Péssimo": "em péssimo estado",
};

function dataBR(d) { if (!d) return "—"; const [a, m, dia] = d.split("-"); return `${dia}/${m}/${a}`; }

// Gera o Termo de Vistoria em PDF no modelo Acontece.
export async function gerarLaudoPDF(v) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, LW = W - 2 * M;
  let y = 16;
  const GREEN = [43, 92, 43], GOLD = [201, 162, 39], INK = [30, 30, 30], SUB = [90, 90, 90];

  const nl = (h = 5.2) => { y += h; if (y > 278) { doc.addPage(); y = 18; } };
  const rule = (col = GREEN, w = 0.5) => { doc.setDrawColor(...col); doc.setLineWidth(w); doc.line(M, y, W - M, y); };
  const write = (txt, x, opt = {}) => {
    doc.setFont("helvetica", opt.bold ? "bold" : "normal");
    doc.setFontSize(opt.size || 10);
    doc.setTextColor(...(opt.color || INK));
    doc.text(txt, x, y, opt.align ? { align: opt.align } : undefined);
  };
  // barra de seção (faixa verde com título)
  const secao = (titulo) => {
    nl(3); doc.setFillColor(...GREEN); doc.rect(M, y - 4, LW, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 3, y + 1); nl(9);
  };
  // par rótulo/valor
  const campo = (rotulo, valor) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...SUB);
    doc.text(rotulo, M, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
    const vlines = doc.splitTextToSize(valor || "—", LW - 42);
    vlines.forEach((l, i) => { doc.text(l, M + 42, y); if (i < vlines.length - 1) nl(4.6); });
    nl(6);
  };

  // ---- CABEÇALHO ----
  const logo = await carregarLogo();
  if (logo) { const lw = 34, lh = lw * 326 / 365; doc.addImage(logo, "PNG", (W - lw) / 2, y, lw, lh); y += lh; }
  nl(2);
  write("TERMO DE VISTORIA", W / 2, { bold: true, size: 15, color: GREEN, align: "center" }); nl(6);
  write("ACONTECE ASSESSORIA E PLANEJAMENTO IMOBILIÁRIO LTDA", W / 2, { size: 9, color: SUB, align: "center" }); nl(5);
  write(`Vistoria nº ${v.codigo}`, W / 2, { bold: true, size: 11, align: "center" }); nl(4);
  rule(GOLD, 0.8); nl(7);

  // realizada por / em
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...SUB);
  doc.text("REALIZADA POR:", M, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
  doc.text((v.vistoriador?.nome || "—").toUpperCase(), M + 34, y);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...SUB);
  doc.text("REALIZADA EM:", W - M - 44, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
  doc.text(dataBR(v.data_vistoria), W - M - 6, y, { align: "right" });
  nl(4);

  // ---- DADOS DO IMÓVEL ----
  secao("DADOS DO IMÓVEL");
  campo("Tipo de vistoria", v.tipo?.nome);
  campo("Imóvel", v.imovel?.endereco);
  if (v.imovel?.metragem) campo("Metragem", `${v.imovel.metragem} m²`);
  if (v.imovel?.bairro || v.imovel?.cidade)
    campo("Bairro / Cidade", [v.imovel?.bairro, v.imovel?.cidade].filter(Boolean).join(" - "));

  // ---- AMBIENTES ----
  secao("AMBIENTES");
  (v.ambientes || []).forEach(amb => {
    nl(1);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...GREEN);
    doc.text(`${amb.nome.toUpperCase()}${amb.complemento ? "  —  " + amb.complemento : ""}`, M, y);
    nl(2); rule([210, 210, 210], 0.3); nl(5);

    (amb.itens || []).forEach(it => {
      // "- Item  cor/material : estado. (observação) [DIVERGÊNCIA]"
      let frase = "";
      if (it.cor_material) frase += it.cor_material;
      const estado = ESTADO_FRASE[it.estado] || (it.estado || "").toLowerCase();
      frase += (frase ? " : " : "") + estado;
      if (it.observacao) frase += `. (${it.observacao})`;

      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...INK);
      const nome = `-  ${it.nome} `;
      doc.text(nome, M, y);
      const nomeW = doc.getTextWidth(nome);
      doc.setFont("helvetica", "normal");
      const linhas = doc.splitTextToSize(frase, LW - nomeW);
      linhas.forEach((l, i) => {
        doc.text(l, i === 0 ? M + nomeW : M + 4, y);
        if (i < linhas.length - 1) nl(4.6);
      });
      if (it.divergencia) {
        doc.setFont("helvetica", "bold"); doc.setTextColor(192, 57, 43);
        doc.text(`   ▲ DIVERGÊNCIA — responsável: ${it.responsavel || "—"}`, M + 4, y + 4.6);
        doc.setTextColor(...INK); nl(4.6);
      }
      nl(5);
    });
    nl(2);
  });

  // ---- TOUR 360° ----
  if (v.tour_360_url) {
    nl(2); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN); doc.setFontSize(9.5);
    doc.text("Vistoria em 360°: ", M, y);
    const lw2 = doc.getTextWidth("Vistoria em 360°: ");
    doc.setFont("helvetica", "normal"); doc.setTextColor(46, 125, 176);
    doc.textWithLink(v.tour_360_url, M + lw2, y, { url: v.tour_360_url }); nl(6);
  }

  // ---- ASSINATURAS ----
  nl(16);
  const assin = (v.assinaturas?.length ? v.assinaturas.map(a => a.tipo) : ["Locador", "Locatário"]);
  const colW = LW / Math.min(assin.length, 2);
  assin.slice(0, 2).forEach((tipo, i) => {
    const x = M + i * colW;
    doc.setDrawColor(40); doc.setLineWidth(0.4); doc.line(x + 8, y, x + colW - 8, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...SUB);
    doc.text(tipo, x + colW / 2, y + 5, { align: "center" });
  });

  // rodapé com numeração
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(8); doc.setTextColor(...SUB);
    doc.text(`Vistoria ${v.codigo} — Acontece Assessoria e Planejamento Imobiliário`, M, 290);
    doc.text(`Página ${p} de ${total}`, W - M, 290, { align: "right" });
  }

  doc.save(`termo-vistoria-${v.codigo}.pdf`);
}
