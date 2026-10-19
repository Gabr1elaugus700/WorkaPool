import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcTabShell from "../components/ExpedicaoIbcTabShell";
import CargaIbcCard from "../components/CargaIbcCard";
import { useCargasEmViagem } from "../hooks/useCargasEmViagem";
import { resolveIbcTabStatus } from "../utils/resolveIbcTabStatus";

/**
 * Cargas expedidas cuja viagem ainda não foi fechada (#320).
 */
export default function ExpedicaoIbcEmViagemView() {
  const { allowed, isLoading, error, data } = useCargasEmViagem();

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  const cargas = data ?? [];

  return (
    <ExpedicaoIbcTabShell
      activeSection="em-viagem"
      description="Cargas expedidas cuja viagem ainda não foi fechada."
      status={resolveIbcTabStatus({
        isLoading,
        error,
        isEmpty: cargas.length === 0,
        loadingLabel: "Carregando cargas em viagem…",
        empty: {
          title: "Nenhuma carga em viagem no momento.",
          nextStep: "Ao fechar a expedição de uma carga em Aguardando expedição, ela passa para cá.",
        },
      })}
    >
      {cargas.map((item) => (
        <CargaIbcCard key={item.codCar} variant="em-viagem" item={item} />
      ))}
    </ExpedicaoIbcTabShell>
  );
}
