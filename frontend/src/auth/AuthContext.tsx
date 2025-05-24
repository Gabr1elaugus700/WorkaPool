import { createContext, useContext, useState, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

// Payload esperado no JWT
type JwtPayload = {
  id: string;
  role: string;
  user?: string; // 'user' = nome de usuário no token
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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<JwtPayload | null>(() => {
    const saved = localStorage.getItem("token");
    return saved ? jwtDecode<JwtPayload>(saved) : null;
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(jwtDecode<JwtPayload>(newToken));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

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
