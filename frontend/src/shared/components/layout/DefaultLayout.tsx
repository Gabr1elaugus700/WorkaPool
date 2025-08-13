import React from "react";
import { Link } from "react-router-dom";
import { Toaster } from "sonner";

import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

import ButtonLink from "@/components/navBar/ButtonLink";
// ...existing code...


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


  return (
    <div className="min-h-screen flex flex-col ">
      {/* Navbar */}
      <nav className="bg-primary text-primary-foreground shadow">

        <div className="container mx-auto px-3 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-white">
            WorkaPool
          </Link>

          {/* Links */}
          <div className="flex gap-4">
            <ButtonLink to="/">Início</ButtonLink>

            <ButtonLink
              to="/cargas"
              allowedRoles={["VENDAS", "LOGISTICA", "ADMIN", "ALMOX"]}
            >
              Cargas
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

            {/* <ButtonLink
              to="/dashboardTest"
              allowedRoles={["ADMIN"]}
            >
              DashBoardTeste
            </ButtonLink> */}
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
        <div className="flex items-center gap-3">
          <>

          </>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1 container mx-auto p-4">{children}</main>

      {/* Toaster do Sonner */}
      <Toaster richColors position="top-center" />

      {/* Rodapé */}
      <footer className="bg-white border-t text-center py-4 text-sm text-gray-500">
        &copy; 2025 - Feito com 🧠 por Gabriel Garbugio. V 1.0.4
      </footer>
    </div>
  );
}
