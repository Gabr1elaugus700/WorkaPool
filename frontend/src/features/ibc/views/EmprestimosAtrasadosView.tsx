import { useAuth } from "@/auth/AuthContext";
import EmprestimosAtrasadosTabela from "../components/EmprestimosAtrasadosTabela";
import ControleIbcShell from "../components/ControleIbcShell";
import { useEmprestimosAtrasados } from "../hooks/useEmprestimosAtrasados";
import { controleIbcSections } from "../utils/controleIbcSections";
import { resolveIbcTabStatus } from "../utils/resolveIbcTabStatus";

export default function EmprestimosAtrasadosView() {
  const { user } = useAuth();
  const access = controleIbcSections.resolve(user?.role, "emprestimos");
  const { isLoading, error, data } = useEmprestimosAtrasados(access.status === "ok");
  const itens = data?.itens ?? [];

  return (
    <ControleIbcShell
      activeSection="emprestimos"
      description="Empréstimos cujo prazo de devolução já passou e o IBC continua no cliente."
      status={
        access.status === "ok"
          ? resolveIbcTabStatus({
              isLoading,
              error,
              isEmpty: itens.length === 0,
              loadingLabel: "Carregando empréstimos…",
              empty: {
                title: "Nenhum empréstimo em atraso.",
                nextStep: "Quando o prazo passar e o IBC continuar no cliente, a linha aparece aqui.",
              },
            })
          : null
      }
    >
      <EmprestimosAtrasadosTabela itens={itens} />
    </ControleIbcShell>
  );
}
