import React from "react";
import { Link } from "react-router-dom";
import { Toaster } from "sonner";

type Props = {
  children: React.ReactNode;
};

export default function DefaultLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-emerald-600 shadow">
        <div className="container mx-auto px-3 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-white">
            WorkaPool
          </Link>

          {/* Links */}
          <div className="flex gap-4">
            <Link
              to="/"
              className="text-white hover:text-black transition-colors"
            >
              Início
            </Link>
            <Link
              to="/metas"
              className="text-white hover:text-black transition-colors"
            >
              Metas
            </Link>
            <Link
              to="/dashboard"
              className="text-white hover:text-black transition-colors"
            >
              DashBoards
            </Link>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1 container mx-auto p-4">{children}</main>

      {/* Toaster do Sonner */}
      <Toaster richColors position="top-center" />

      {/* Rodapé */}
      <footer className="bg-white border-t text-center py-4 text-sm text-gray-500">
        &copy; 2025 - Feito com 🧠 por Gabriel Garbugio.
      </footer>
    </div>
  );
}
