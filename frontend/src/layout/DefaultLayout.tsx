import React from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

import { useAuth } from "@/auth/AuthContext";
import { AppTopNav } from "./navigation/AppTopNav";
import { MobileBottomNav } from "./navigation/MobileBottomNav";
import { useVisibleNavItems } from "./navigation/useVisibleNavItems";

type Props = {
  children: React.ReactNode;
};

export default function DefaultLayout({ children }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { mainItems, adminItems, mobileItems, isActive, userName } = useVisibleNavItems();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppTopNav
        mainItems={mainItems}
        adminItems={adminItems}
        isActive={isActive}
        userName={userName}
        onLogout={handleLogout}
      />

      <MobileBottomNav items={mobileItems} isActive={isActive} />

      <main className="flex-1 container mx-auto p-4 pb-24 md:pb-4 ">{children}</main>

      <Toaster richColors position="top-center" />

      <footer className="hidden md:block bg-white border-t text-center py-4 text-sm text-gray-500">
        &copy; 2025 - Feito com 🧠 por Gabriel Garbugio. V 2.0.5
      </footer>
    </div>
  );
}
