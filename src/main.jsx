import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const css = `*{box-sizing:border-box} body{margin:0} button{font-family:inherit}
input,select{font-family:inherit} a{color:inherit}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
