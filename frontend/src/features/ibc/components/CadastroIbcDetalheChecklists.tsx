import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";
import CadastroIbcChecklists from "./CadastroIbcChecklists";

type Props = { ibcId: string; canWrite: boolean };

export default function CadastroIbcDetalheChecklists({ ibcId, canWrite }: Props) {
  const state = useIbcChecklistVinculos(ibcId);
  if (state.isLoading) return <CadastroIbcSectionSkeleton rows={2} />;
  if (state.errorMessage) return <CadastroIbcSectionError message={state.errorMessage} onRetry={state.retry} />;
  return (
    <CadastroIbcChecklists
      canWrite={canWrite}
      vinculos={state.vinculos}
      checklists={state.checklists}
      submitting={state.isVinculando}
      pendingChecklistId={state.pendingChecklistId}
      onVincular={state.vincular}
      onDesvincular={state.desvincular}
    />
  );
}
