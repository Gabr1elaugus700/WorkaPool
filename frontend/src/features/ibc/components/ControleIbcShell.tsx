import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import IbcAccessDeniedAlert from "./IbcAccessDeniedAlert";
import IbcPageHeader from "./IbcPageHeader";
import IbcPageTabs from "./IbcPageTabs";
import IbcStatusContent, { type IbcStatusContentProps } from "./IbcStatusContent";
import { controleIbcSections, type ControleIbcSection } from "../utils/controleIbcSections";

type Props = {
  activeSection: ControleIbcSection;
  description: string;
  status: IbcStatusContentProps | null;
  children?: ReactNode;
};

export default function ControleIbcShell({ activeSection, description, status, children }: Props) {
  const { user } = useAuth();
  const access = controleIbcSections.resolve(user?.role, activeSection);

  if (access.status === "redirect") {
    return <Navigate to={access.to} replace />;
  }

  if (access.status === "denied") {
    return (
      <DefaultLayout>
        <IbcAccessDeniedAlert requiredRoles={controleIbcSections.roles} targetPhrase="o Controle IBC" />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <IbcPageHeader
        title="Controle IBC"
        icon={<ClipboardList className="h-7 w-7 text-primary" aria-hidden />}
        tabs={
          <IbcPageTabs
            tabs={controleIbcSections.tabs}
            activeId={activeSection}
            userRole={user?.role}
            ariaLabel="Controle IBC"
          />
        }
      />
      <p className="mb-4 max-w-prose text-sm text-muted-foreground">{description}</p>
      {status ? (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <IbcStatusContent {...status} />
        </div>
      ) : (
        children
      )}
    </DefaultLayout>
  );
}
