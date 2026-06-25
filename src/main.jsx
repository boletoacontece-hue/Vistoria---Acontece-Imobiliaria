import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const css = `
*{box-sizing:border-box} body{margin:0} button{font-family:inherit}
input,select{font-family:inherit} a{color:inherit}

/* grade de 3 colunas dos itens da vistoria — empilha no celular */
.item-grid{display:grid;grid-template-columns:1.2fr 1fr 1.3fr;gap:12px}

/* tabelas com rolagem horizontal no celular */
.table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}

@media (max-width:760px){
  .app-main{padding:14px !important}
  .item-grid{grid-template-columns:1fr !important}
  .page-head{padding:16px 18px !important}
  .page-head h1{font-size:19px !important}
  table{min-width:560px}
}
`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
