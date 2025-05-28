import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  loading: boolean; // <- ADD
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true); // <- ADD

  useEffect(() => {
  console.log("AuthProvider: iniciando verificação de token no localStorage...");
  try {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      console.log("Token encontrado:", savedToken);
      const decoded = jwtDecode<JwtPayload>(savedToken);
      setToken(savedToken);
      setUser(decoded);
      console.log("Usuário decodificado:", decoded);
    } else {
      console.log("Nenhum token encontrado no localStorage.");
    }
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    localStorage.removeItem("token");
  } finally {
    console.log("Finalizando loading...");
    setLoading(false);
  }
}, []);

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
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return context;
};
