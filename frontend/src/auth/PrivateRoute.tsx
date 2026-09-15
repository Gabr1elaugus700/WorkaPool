import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ReactNode } from "react";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}
