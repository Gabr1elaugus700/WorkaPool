// src/routes/index.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import PrivateRoute from "@/auth/PrivateRoute";
import Home from "../pages/Home";
import VendedorMetas from "../pages/MetasPage";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import Dashboard from "../pages/dashboardVendas";
import DashboardTest from "../pages/dashboard";
import CargasPage from "../pages/CargasPage";
import ClientesInativos from "../pages/ClientesInativos";
import { OrderLossView, SellerOrdersView } from "@/features/orderLoss";
import Login from "@/auth/Login";
import FretesPage from "@/pages/FretesPage";
import OsListView from "@/features/workOrder/views/osView";
import VistoriaView from "@/features/workOrder/views/vistoriaView";
import UsersView from "@/features/users/views/usersView";

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
            path="/order-loss"
            element={
              <PrivateRoute>
                <OrderLossView />
              </PrivateRoute>
            }
          />
          <Route
            path="/Os"
            element={
              <PrivateRoute>
                <OsListView />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <PrivateRoute>
                <SellerOrdersView />
              </PrivateRoute>
            }
          />
          <Route
            path="/vistoria"
            element={
              <PrivateRoute>
                <VistoriaView />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UsersView />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendasPerdidas"
            element={
              <PrivateRoute>
                <ClientesInativos />
              </PrivateRoute>
            }
          />
          <Route
            path="/metas/*"
            element={
              <PrivateRoute>
                <VendedorMetas />
              </PrivateRoute>
            }
          />
          <Route
            path="/fretes"
            element={
              <PrivateRoute>
                <FretesPage />
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
                <CargasPage />
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
