import React from "react";
import { Link } from "react-router-dom";
import { Toaster } from "sonner";

import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, LogOutIcon,  Home } from "lucide-react";

import ButtonLink from "@/components/navBar/ButtonLink";

type Props = {
  children: React.ReactNode;
};

export default function DefaultLayout({ children }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col ">
      {/* Navbar */}
      <nav className="hidden md:block bg-primary text-primary-foreground shadow">

        <div className="container mx-auto px-3 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-white">
            WorkaPool
          </Link>

          {/* Links */}
          <div className="flex gap-4">

            <ButtonLink
              to="/order-loss"
              allowedRoles={["ADMIN"]}
            >
              Pedidos
            </ButtonLink>
            <ButtonLink
              to="/my-orders"
              allowedRoles={["ADMIN", "VENDAS"]}
            >
              Meus Pedidos
            </ButtonLink>
            <ButtonLink
              to="/cargas"
              allowedRoles={["VENDAS", "LOGISTICA", "ADMIN", "ALMOX"]}
            >
              Cargas
            </ButtonLink>
            
            {/* <ButtonLink to="/">Início</ButtonLink>

            
            <ButtonLink
              to="/users"
              allowedRoles={["ADMIN"]}
            >
              Usuários
            </ButtonLink> */}

            
            <ButtonLink
              to="/os"
              allowedRoles={["VENDAS", "LOGISTICA", "ADMIN", "ALMOX"]}
            >
              Ordens de Serviço
            </ButtonLink>
            <ButtonLink
              to="/vistoria"
              allowedRoles={["VENDAS", "LOGISTICA", "ADMIN", "ALMOX"]}
            >
              Vistorias
            </ButtonLink>

            <ButtonLink
              to="/fretes"
              allowedRoles={["VENDAS", "LOGISTICA", "ADMIN", "ALMOX"]}
            >
              Fretes
            </ButtonLink>

            <ButtonLink
              to="/metas"
              allowedRoles={["ADMIN"]}
            >
              Metas
            </ButtonLink>

            <ButtonLink
              to="/vendasPerdidas"
              allowedRoles={["ADMIN"]}
            >
              Vendas Perdidas
            </ButtonLink>

            <ButtonLink
              to="/dashboard"
              allowedRoles={["ADMIN"]}
            >
              Dashboards
            </ButtonLink>

            <ButtonLink
              to="/dashboardTest"
              allowedRoles={["ADMIN"]}
            >
              DashBoardTeste
            </ButtonLink>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-primary-foreground hover:text-background flex items-center gap-2"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Sair</span>
            </Button>

          </div>
        </div>
      </nav>

      
      {/* Bottom Navigation (somente mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-primary/20 bg-white px-4 pt-2 pb-5 md:hidden">
        <div className="flex justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-green-600" : "text-slate-500"
              }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            to="/vistoria"
            className={`flex flex-col items-center gap-1 ${isActive("/vistoria") ? "text-green-600" : "text-slate-500"
              }`}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-medium">Vistorias</span>
          </Link>

          <Link
            to="/os"
            className={`flex flex-col items-center gap-1 ${isActive("/os") ? "text-green-600" : "text-slate-500"
              }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs font-medium">Ordens</span>
          </Link>


        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1 container mx-auto p-4 pb-24 md:pb-4 bg-background/50">{children}</main>

      {/* Toaster do Sonner */}
      <Toaster richColors position="top-center" />

      {/* Rodapé Desktop*/}
      <footer className="hidden md:block bg-white border-t text-center py-4 text-sm text-gray-500">
        &copy; 2025 - Feito com 🧠 por Gabriel Garbugio. V 2.0.1
      </footer>
    </div>
  );
}
