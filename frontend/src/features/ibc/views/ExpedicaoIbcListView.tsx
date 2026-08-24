import { useCallback, useEffect, useState } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import CargaExpedicaoListRow from "../components/CargaExpedicaoListRow";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import type { CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { toError } from "../utils/toError";

/**
 * Lista de cargas ABERTA/FECHADA para preparação de expedição IBC (#61).
 */
export default function ExpedicaoIbcListView() {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);

  const [items, setItems] = useState<CargaExpedicaoListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ibcExpedicaoService.listCargasExpedicao();
      setItems(data);
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void carregar();
  }, [allowed, carregar]);

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  return (
    <ExpedicaoIbcAsyncState
      loading={loading}
      error={error}
      loadingLabel="Carregando cargas de expedição…"
    >
      <DefaultLayout>
        <ExpedicaoIbcPageHeader />

        <div className="rounded-lg bg-card p-4 shadow-md sm:p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Cargas ABERTA e FECHADA para preparação de alocação IBC.
          </p>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma carga disponível para expedição IBC.
            </p>
          ) : (
            items.map((item) => (
              <CargaExpedicaoListRow key={item.codCar} item={item} />
            ))
          )}
        </div>
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
