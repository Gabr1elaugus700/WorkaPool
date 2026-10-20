import { Navigate, useLocation } from "react-router-dom";
import { gestaoIbcSections } from "../utils/gestaoIbcSections";

export default function LegacyIbcTabRedirect() {
  const { pathname, search } = useLocation();
  const to = gestaoIbcSections.legacyTarget(pathname, search) ?? gestaoIbcSections.path("containers");
  return <Navigate to={to} replace />;
}
