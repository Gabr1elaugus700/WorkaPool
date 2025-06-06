// src/routes/index.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import PrivateRoute from "@/auth/PrivateRoute";
import Home from "../pages/Home";
import VendedorMetas from "../pages/VendedorMetas";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import Dashboard from '../pages/dashboardVendas';
import DashboardTest from '../pages/dashboard'
import MontagemDeCargas from '../pages/controleDeCargas';
import Login from "@/auth/Login";


const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          <Route
            path="/metas"
            element={
              <PrivateRoute>
                <VendedorMetas />
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <Clientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute>
                <Pedidos />
              </PrivateRoute>
            }
          />
          <Route
            path="/cargas"
            element={
              <PrivateRoute>
                <MontagemDeCargas />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboardTest"
            element={
              <PrivateRoute>
                <DashboardTest />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
