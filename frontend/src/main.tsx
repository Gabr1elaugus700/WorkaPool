// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes";
import './styles/tailwind.css'; 
// import { registerSw } from "virtual:pwa-register";

// registerSw(); 


ReactDOM.createRoot(document.getElementById("root")!).render(
<React.StrictMode>
  <AppRoutes />
</React.StrictMode>
);
