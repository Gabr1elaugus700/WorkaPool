import { createContext, useContext, useState, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

// Payload esperado no JWT
type JwtPayload = {
  id: string;
  role: string;
  user?: string;
  name?: string;
  codRep: number;
};

// Tudo que o contexto expõe
type AuthContextType = {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem("token");
      return saved || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<JwtPayload | null>(() => {
    try {
      const saved = localStorage.getItem("token");
      if (!saved) return null;
      return jwtDecode<JwtPayload>(saved);
    } catch (error) {
      console.error("Token inválido ao iniciar AuthProvider:", error);
      localStorage.removeItem("token");
      return null;  
    }
  });

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(decoded);
    } catch (error) {
      console.error("Erro ao logar com token inválido:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return context;
};
