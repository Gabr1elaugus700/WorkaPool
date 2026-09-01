import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  allowedRoles?: readonly string[];
};

export default function PrivateRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}
