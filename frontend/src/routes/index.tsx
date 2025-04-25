// src/routes/index.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import VendedorMetas from "../pages/VendedorMetas";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import Dashboard from '../pages/dashboardVendas';
import DashboardTest from '../pages/dashboard'


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/metas" element={<VendedorMetas />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboardTest" element={<DashboardTest />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
