// src/routes/index.tsx

import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import PrivateRoute from "@/auth/PrivateRoute";
import Home from "../pages/Home";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import CargasPage from "../pages/CargasPage";
import ExpedicaoIbcPage from "../pages/ExpedicaoIbcPage";
import ExpedicaoIbcPreparacaoPage from "../pages/ExpedicaoIbcPreparacaoPage";
import CadastroIbcPage from "../pages/CadastroIbcPage";
import ClientesInativos from "../pages/ClientesInativos";
import { OrderLossView } from "@/features/orderLoss";
import Login from "@/auth/Login";
import UsersView from "@/features/users/views/usersView";
import OverviewSyncAdminView from "@/features/overviewCustomer/views/OverviewSyncAdminView";
import OverviewCustomerDetailView from "@/features/overviewCustomer/views/OverviewCustomerDetailView";
import OverviewCustomerPortfolioView from "@/features/overviewCustomer/views/OverviewCustomerPortfolioView";
import {
  buildCrmCustomerHref,
  CRM_ACCESS_ROLES,
  CRM_PORTFOLIO_PATH,
} from "@/features/overviewCustomer/utils/overviewCustomerRoutes.utils";

function LegacyOverviewCustomerRedirect() {
  const { clienteId } = useParams();
  return (
    <Navigate
      to={clienteId ? buildCrmCustomerHref(clienteId) : CRM_PORTFOLIO_PATH}
      replace
    />
  );
}

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
            path="/users"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <UsersView />
              </PrivateRoute>
            }
          />
          <Route
            path={CRM_PORTFOLIO_PATH}
            element={
              <PrivateRoute allowedRoles={CRM_ACCESS_ROLES}>
                <OverviewCustomerPortfolioView />
              </PrivateRoute>
            }
          />
          <Route
            path={`${CRM_PORTFOLIO_PATH}/:clienteId`}
            element={
              <PrivateRoute allowedRoles={CRM_ACCESS_ROLES}>
                <OverviewCustomerDetailView />
              </PrivateRoute>
            }
          />
          <Route path="/overview/customers" element={<LegacyOverviewCustomerRedirect />} />
          <Route
            path="/overview/customers/:clienteId"
            element={<LegacyOverviewCustomerRedirect />}
          />
          <Route
            path="/overview/sync"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <OverviewSyncAdminView />
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
            path="/expedicao-ibc"
            element={
              <PrivateRoute>
                <ExpedicaoIbcPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc/:codCar"
            element={
              <PrivateRoute>
                <ExpedicaoIbcPreparacaoPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/cadastro-ibc"
            element={
              <PrivateRoute>
                <CadastroIbcPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
