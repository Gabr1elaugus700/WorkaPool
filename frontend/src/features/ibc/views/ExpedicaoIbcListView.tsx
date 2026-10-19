import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcTabShell from "../components/ExpedicaoIbcTabShell";
import CargaIbcCard from "../components/CargaIbcCard";
import { useCargasExpedicao } from "../hooks/useCargasExpedicao";
import { resolveIbcTabStatus } from "../utils/resolveIbcTabStatus";

/**
 * Lista de cargas FECHADA com pedidos IBC aguardando expedição (#61, #296).
 */
export default function ExpedicaoIbcListView() {
  const { allowed, isLoading, error, data } = useCargasExpedicao();

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  const cargas = data ?? [];

  return (
    <ExpedicaoIbcTabShell
      activeSection="aguardando"
      description="Cargas FECHADA com pedidos IBC aguardando expedição."
      status={resolveIbcTabStatus({
        isLoading,
        error,
        isEmpty: cargas.length === 0,
        loadingLabel: "Carregando cargas de expedição…",
        empty: {
          title: "Nenhuma carga aguardando expedição.",
          nextStep: "Quando uma carga com pedidos IBC for fechada no Sapiens, ela aparece aqui.",
        },
      })}
    >
      {cargas.map((item) => (
        <CargaIbcCard key={item.codCar} variant="aguardando" item={item} />
      ))}
    </ExpedicaoIbcTabShell>
  );
}
