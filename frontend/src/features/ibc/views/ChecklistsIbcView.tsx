import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import GestaoIbcHeader from "../components/GestaoIbcHeader";
import CadastroIbcSectionError from "../components/CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "../components/CadastroIbcSectionSkeleton";
import IbcChecklistItensSection from "../components/IbcChecklistItensSection";
import IbcChecklistsSection from "../components/IbcChecklistsSection";
import { useIbcChecklistItens } from "../hooks/useIbcChecklistItens";
import { useIbcChecklists } from "../hooks/useIbcChecklists";
import {
  IBC_CADASTRO_WRITE_ROLES,
  canWriteIbcCadastro,
} from "../utils/ibcCadastroPermissions";
import { toError } from "../utils/toError";

export default function ChecklistsIbcView() {
  const { user } = useAuth();
  const allowed = canWriteIbcCadastro(user?.role);
  const itens = useIbcChecklistItens(allowed);
  const checklists = useIbcChecklists(allowed);

  if (!allowed) {
    return (
      <ExpedicaoIbcAccessDeniedAlert
        targetPhrase="os Checklists de IBC"
        requiredRoles={IBC_CADASTRO_WRITE_ROLES}
      />
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6">
        <GestaoIbcHeader activeSection="checklists" userRole={user?.role} />
        <p className="max-w-prose text-sm text-muted-foreground">
          Cadastre os itens de inspeção e monte checklists nomeados com itens ordenados e notas
          mínimas. Item crítico vale em qualquer checklist.
        </p>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-base font-semibold tracking-tight">Catálogo de itens</h2>
          {itens.query.isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : itens.query.error ? (
            <CadastroIbcSectionError
              message={toError(itens.query.error).message}
              onRetry={() => {
                void itens.query.refetch();
              }}
            />
          ) : (
            <IbcChecklistItensSection
              itens={itens.query.data ?? []}
              saving={itens.isSaving}
              onCreate={itens.createItem}
              onUpdate={itens.updateItem}
            />
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-base font-semibold tracking-tight">Checklists</h2>
          {checklists.query.isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : checklists.query.error ? (
            <CadastroIbcSectionError
              message={toError(checklists.query.error).message}
              onRetry={() => {
                void checklists.query.refetch();
              }}
            />
          ) : (
            <IbcChecklistsSection
              checklists={checklists.query.data ?? []}
              catalogo={itens.query.data ?? []}
              saving={checklists.isSaving}
              onLoad={checklists.loadChecklist}
              onCreate={checklists.createChecklist}
              onUpdate={checklists.updateChecklist}
            />
          )}
        </section>
      </div>
    </DefaultLayout>
  );
}
