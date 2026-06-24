import { jsPDF } from "jspdf";

// Gera o Termo de Vistoria em PDF, na identidade Acontece.
// Recebe a vistoria completa (carregarVistoria) e baixa o arquivo.
export function gerarLaudoPDF(v) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18;
  let y = 20;
  const GREEN = [43, 92, 43];

  const linha = () => { doc.setDrawColor(...GREEN); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); };
  const quebra = (h = 6) => { y += h; if (y > 275) { doc.addPage(); y = 20; } };

  // Cabeçalho
  doc.setTextColor(...GREEN); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("ACONTECE", W / 2, y, { align: "center" });
  doc.setFontSize(8); doc.setTextColor(90);
  doc.text("ASSESSORIA E PLANEJAMENTO IMOBILIÁRIO", W / 2, y + 5, { align: "center" });
  y += 11; linha(); quebra(8);

  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20);
  doc.text(`TERMO DE VISTORIA — ${(v.tipo?.nome || "").toUpperCase()}`, W / 2, y, { align: "center" });
  quebra(10);

  // Dados
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const dados = [
    `Imóvel: ${v.imovel?.endereco || "—"}`,
    `Vistoriador: ${v.vistoriador?.nome || "—"}    Data: ${v.data_vistoria || "—"}    Código: ${v.codigo}`,
  ];
  dados.forEach(d => { doc.splitTextToSize(d, W - 2 * M).forEach(l => { doc.text(l, M, y); quebra(5.5); }); });
  quebra(3);

  // Ambientes → itens
  (v.ambientes || []).forEach(amb => {
    doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN); doc.setFontSize(11);
    doc.text(`${amb.nome.toUpperCase()}${amb.complemento ? " — " + amb.complemento : ""}`, M, y);
    quebra(2); doc.setDrawColor(220); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); quebra(5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(30); doc.setFontSize(10);
    (amb.itens || []).forEach(it => {
      let txt = `• ${it.nome}: ${(it.estado || "").toLowerCase()}`;
      if (it.cor_material) txt += `, ${it.cor_material.toLowerCase()}`;
      if (it.observacao) txt += `. ${it.observacao}`;
      const linhas = doc.splitTextToSize(txt, W - 2 * M - 4);
      linhas.forEach((l, i) => { doc.text(l, M + (i ? 4 : 0), y); quebra(5); });
      if (it.divergencia) {
        doc.setTextColor(192, 57, 43); doc.setFont("helvetica", "bold");
        doc.text(`   [DIVERGÊNCIA — responsável: ${it.responsavel || "—"}]`, M + 4, y);
        doc.setTextColor(30); doc.setFont("helvetica", "normal"); quebra(5);
      }
    });
    quebra(4);
  });

  // Assinaturas
  quebra(14);
  const assin = (v.assinaturas?.length ? v.assinaturas.map(a => a.tipo) : ["Locador", "Locatário"]);
  const colW = (W - 2 * M) / Math.min(assin.length, 2);
  assin.slice(0, 2).forEach((tipo, i) => {
    const x = M + i * colW;
    doc.setDrawColor(40); doc.line(x + 6, y, x + colW - 6, y);
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text(tipo, x + colW / 2, y + 5, { align: "center" });
  });

  doc.save(`termo-vistoria-${v.codigo}.pdf`);
}
