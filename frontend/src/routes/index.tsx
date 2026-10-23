// src/routes/index.tsx

import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import PrivateRoute from "@/auth/PrivateRoute";
import Home from "../pages/Home";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import CargasPage from "../pages/CargasPage";
import ExpedicaoIbcPage from "../pages/ExpedicaoIbcPage";
import ExpedicaoIbcEmViagemPage from "../pages/ExpedicaoIbcEmViagemPage";
import AvisosRepresentantePage from "../pages/AvisosRepresentantePage";
import EntradaPatioIbcPage from "../pages/EntradaPatioIbcPage";
import ExpedicaoIbcCargaPage from "../pages/ExpedicaoIbcCargaPage";
import CadastroIbcPage from "../pages/CadastroIbcPage";
import ConciliacaoErpPage from "../pages/ConciliacaoErpPage";
import EmprestimosAtrasadosPage from "../pages/EmprestimosAtrasadosPage";
import ChecklistsIbcView from "@/features/ibc/views/ChecklistsIbcView";
import IbcProdutoConfigView from "@/features/ibc/views/IbcProdutoConfigView";
import LegacyIbcTabRedirect from "@/features/ibc/components/LegacyIbcTabRedirect";
import { IBC_CADASTRO_VIEW_ROLES, IBC_CADASTRO_WRITE_ROLES } from "@/features/ibc/utils/ibcCadastroPermissions";
import { IBC_EXPEDICAO_ROLES } from "@/features/ibc/utils/canAccessExpedicaoIbc";
import { controleIbcSections } from "@/features/ibc/utils/controleIbcSections";
import { ibcEmprestimoAtrasadoPermissions } from "@/features/ibc/utils/ibcEmprestimoAtrasadoPermissions";
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

function LegacyConciliacaoViagemRedirect() {
  const { codCar } = useParams();
  return <Navigate to={`/expedicao-ibc/${codCar}/fechar-viagem`} replace />;
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
            path="/controle-ibc"
            element={
              <PrivateRoute allowedRoles={controleIbcSections.roles}>
                <AvisosRepresentantePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/controle-ibc/emprestimos"
            element={
              <PrivateRoute allowedRoles={controleIbcSections.roles}>
                <EmprestimosAtrasadosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/avisos-ibc"
            element={
              <PrivateRoute allowedRoles={["VENDAS", "ADMIN"]}>
                <Navigate to="/controle-ibc" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/emprestimos-ibc"
            element={
              <PrivateRoute allowedRoles={ibcEmprestimoAtrasadoPermissions.roles}>
                <Navigate to="/controle-ibc/emprestimos" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc"
            element={
              <PrivateRoute allowedRoles={IBC_EXPEDICAO_ROLES}>
                <ExpedicaoIbcPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc/em-viagem"
            element={
              <PrivateRoute allowedRoles={IBC_EXPEDICAO_ROLES}>
                <ExpedicaoIbcEmViagemPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc/entrada"
            element={
              <PrivateRoute allowedRoles={IBC_EXPEDICAO_ROLES}>
                <EntradaPatioIbcPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc/:codCar/conciliacao"
            element={
              <PrivateRoute allowedRoles={IBC_EXPEDICAO_ROLES}>
                <LegacyConciliacaoViagemRedirect />
              </PrivateRoute>
            }
          />
          <Route
            path="/expedicao-ibc/:codCar/:etapa?"
            element={
              <PrivateRoute allowedRoles={IBC_EXPEDICAO_ROLES}>
                <ExpedicaoIbcCargaPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-ibc"
            element={
              <PrivateRoute>
                <Navigate to="/gestao-ibc/containers" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-ibc/containers"
            element={
              <PrivateRoute>
                <CadastroIbcPage />
              </PrivateRoute>
            }
          />
          <Route path="/gestao-ibc/produtos" element={<PrivateRoute allowedRoles={IBC_CADASTRO_VIEW_ROLES}><IbcProdutoConfigView /></PrivateRoute>} />
          <Route
            path="/gestao-ibc/conciliacao"
            element={
              <PrivateRoute allowedRoles={IBC_CADASTRO_VIEW_ROLES}>
                <ConciliacaoErpPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestao-ibc/checklists"
            element={
              <PrivateRoute allowedRoles={IBC_CADASTRO_WRITE_ROLES}>
                <ChecklistsIbcView />
              </PrivateRoute>
            }
          />
          <Route
            path="/cadastro-ibc"
            element={
              <PrivateRoute>
                <LegacyIbcTabRedirect />
              </PrivateRoute>
            }
          />
          <Route
            path="/conciliacao-ibc"
            element={
              <PrivateRoute allowedRoles={IBC_CADASTRO_VIEW_ROLES}>
                <LegacyIbcTabRedirect />
              </PrivateRoute>
            }
          />
          <Route
            path="/checklists-ibc"
            element={
              <PrivateRoute allowedRoles={IBC_CADASTRO_WRITE_ROLES}>
                <LegacyIbcTabRedirect />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
