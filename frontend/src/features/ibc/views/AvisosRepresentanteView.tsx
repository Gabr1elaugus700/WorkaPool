import { useAuth } from "@/auth/AuthContext";
import AvisoRepresentanteCard from "../components/AvisoRepresentanteCard";
import ControleIbcShell from "../components/ControleIbcShell";
import { useAvisosRepresentante } from "../hooks/useAvisosRepresentante";
import { controleIbcSections } from "../utils/controleIbcSections";
import { resolveIbcTabStatus } from "../utils/resolveIbcTabStatus";

/**
 * Lista de avisos do representante depois do Fechar Viagem (#39).
 */
export default function AvisosRepresentanteView() {
  const { user } = useAuth();
  const access = controleIbcSections.resolve(user?.role, "avisos");
  const { isLoading, error, data, marcarLido } = useAvisosRepresentante(access.status === "ok");
  const avisos = data?.avisos ?? [];
  const pendingId = marcarLido.isPending ? marcarLido.variables : undefined;

  return (
    <ControleIbcShell
      activeSection="avisos"
      description="Containers que ficaram no cliente depois do Fechar viagem."
      status={
        access.status === "ok"
          ? resolveIbcTabStatus({
              isLoading,
              error,
              isEmpty: avisos.length === 0,
              loadingLabel: "Carregando avisos…",
              empty: {
                title: "Nenhum container ficou no cliente.",
                nextStep: "Depois do Fechar viagem, o aviso do representante aparece aqui.",
              },
            })
          : null
      }
    >
      <div className="flex flex-col gap-3">
        {avisos.map((aviso) => (
          <AvisoRepresentanteCard
            key={aviso.id}
            aviso={aviso}
            marcando={pendingId === aviso.id}
            onMarcarLido={marcarLido.mutate}
          />
        ))}
      </div>
    </ControleIbcShell>
  );
}
