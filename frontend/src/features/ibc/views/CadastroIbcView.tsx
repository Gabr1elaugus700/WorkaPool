import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import CadastroIbcPoolList from "../components/CadastroIbcPoolList";
import CadastroIbcAlertsPanel from "../components/CadastroIbcAlertsPanel";
import CadastroIbcSectionError from "../components/CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "../components/CadastroIbcSectionSkeleton";
import GestaoIbcHeader from "../components/GestaoIbcHeader";
import ConfirmarMudancaIbcModal, { type IbcMudancaModo } from "../components/ConfirmarMudancaIbcModal";
import IbcHistoricoDrawer from "../components/IbcHistoricoDrawer";
import IbcChecklistsVinculoDrawer from "../components/IbcChecklistsVinculoDrawer";
import IbcInspecaoDrawer from "../components/IbcInspecaoDrawer";
import IbcInspecoesDrawer from "../components/IbcInspecoesDrawer";
import NovoIbcDrawer from "../components/NovoIbcDrawer";
import { gestaoIbcSections } from "../utils/gestaoIbcSections";
import { useIbcAlerts, useIbcPool, useIbcProdutos } from "../hooks/useIbcCadastro";
import { useIbcConversao, useIbcHistorico } from "../hooks/useIbcConversao";
import { useIbcProdutoConfig } from "../hooks/useIbcProdutoConfig";
import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import {
  IBC_CADASTRO_VIEW_ROLES,
  canViewIbcCadastro,
  canWriteIbcCadastro,
} from "../utils/ibcCadastroPermissions";
import { toError } from "../utils/toError";

type Painel = "novo" | null;

export default function CadastroIbcView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canViewIbcCadastro(user?.role);
  const canWrite = canWriteIbcCadastro(user?.role);
  const [painel, setPainel] = useState<Painel>(null);
  const [incluirHistorico, setIncluirHistorico] = useState(false);
  const [mudanca, setMudanca] = useState<{ ibc: IbcCadastroDTO; modo: IbcMudancaModo } | null>(null);
  const [historicoIbc, setHistoricoIbc] = useState<IbcCadastroDTO | null>(null);
  const [checklistsIbc, setChecklistsIbc] = useState<IbcCadastroDTO | null>(null);
  const [inspecaoIbc, setInspecaoIbc] = useState<IbcCadastroDTO | null>(null);
  const [inspecoesIbc, setInspecoesIbc] = useState<IbcCadastroDTO | null>(null);

  const poolQuery = useIbcPool(allowed, incluirHistorico);
  const alertsQuery = useIbcAlerts(allowed);
  const produtosQuery = useIbcProdutos(allowed);
  const conversao = useIbcConversao();
  const { query: produtoConfig } = useIbcProdutoConfig(allowed && mudanca != null);
  const historicoQuery = useIbcHistorico(historicoIbc?.id ?? null);
  const vinculos = useIbcChecklistVinculos(checklistsIbc?.id ?? null);

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert targetPhrase="o Cadastro IBC" requiredRoles={IBC_CADASTRO_VIEW_ROLES} />;
  }

  const produtos = Array.isArray(produtosQuery.data) ? produtosQuery.data : [];

  return (
    <DefaultLayout>
      <div className="space-y-4">
        <GestaoIbcHeader
          activeSection="containers"
          userRole={user?.role}
          primaryAction={
            canWrite ? (
              <Button type="button" onClick={() => setPainel("novo")}>
                <Plus className="h-4 w-4" aria-hidden />
                Novo IBC
              </Button>
            ) : null
          }
        />

        {alertsQuery.isLoading ? (
          <Skeleton className="h-11 w-full rounded-lg" />
        ) : alertsQuery.error ? (
          <CadastroIbcSectionError
            message={toError(alertsQuery.error).message}
            onRetry={() => void alertsQuery.refetch()}
          />
        ) : (
          <CadastroIbcAlertsPanel alerts={alertsQuery.data ?? []} />
        )}

        {poolQuery.isLoading ? (
          <CadastroIbcSectionSkeleton rows={6} />
        ) : poolQuery.error ? (
          <CadastroIbcSectionError message={toError(poolQuery.error).message} onRetry={() => void poolQuery.refetch()} />
        ) : (
          <CadastroIbcPoolList
            items={poolQuery.data ?? []}
            produtos={produtos}
            canWrite={canWrite}
            incluirHistorico={incluirHistorico}
            onIncluirHistoricoChange={setIncluirHistorico}
            emptyMessage={incluirHistorico ? "Nenhum IBC no histórico." : "Nenhum IBC ativo no pool."}
            emptyNextStep={
              incluirHistorico
                ? "O histórico reúne baixados e substituídos."
                : canWrite
                  ? "Use Novo IBC para cadastrar o primeiro container."
                  : "Quando o almox cadastrar um IBC, ele aparece nesta tabela."
            }
            actionsDisabled={conversao.isPending}
            onConverter={(ibc) => setMudanca({ ibc, modo: "conversion" })}
            onMudarProduto={(ibc) => setMudanca({ ibc, modo: "product_change" })}
            onVerHistorico={setHistoricoIbc}
            onGerenciarChecklists={setChecklistsIbc}
            onInspecionar={setInspecaoIbc}
            onVerInspecoes={setInspecoesIbc}
          />
        )}
      </div>

      {canWrite ? (
        <>
          <NovoIbcDrawer
            open={painel === "novo"}
            produtos={produtos}
            produtosCarregando={produtosQuery.isLoading}
            onOpenChange={(open) => setPainel(open ? "novo" : null)}
            onAbrirProdutos={() => {
              setPainel(null);
              navigate(gestaoIbcSections.path("produtos"));
            }}
          />
        </>
      ) : null}
      {canWrite && mudanca ? (
        <Dialog open onOpenChange={(open) => { if (!open && !conversao.isPending) setMudanca(null); }}>
          <DialogContent className="max-w-lg gap-5" aria-labelledby="ibc-mudanca-titulo" aria-describedby="ibc-mudanca-descricao">
            <ConfirmarMudancaIbcModal
              key={`${mudanca.ibc.id}-${mudanca.modo}`}
              ibc={mudanca.ibc}
              modo={mudanca.modo}
              config={produtoConfig.data ?? null}
              configCarregando={produtoConfig.isLoading}
              configErro={produtoConfig.error ? toError(produtoConfig.error).message : null}
              submitting={conversao.isPending}
              onClose={() => setMudanca(null)}
              onConfirm={async (acao) => {
                if (acao.tipo === "product_change") await conversao.mudarProduto(mudanca.ibc.id, acao.input);
                else await conversao.converter(mudanca.ibc.id, acao.input);
                setMudanca(null);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      {historicoIbc ? (
        <Sheet open onOpenChange={(open) => { if (!open) setHistoricoIbc(null); }}>
          <SheetContent aria-labelledby="ibc-historico-titulo" aria-describedby="ibc-historico-descricao">
            <IbcHistoricoDrawer
              identificador={historicoIbc.identificador}
              eventos={historicoQuery.data ?? []}
              isLoading={historicoQuery.isLoading}
              errorMessage={historicoQuery.error ? toError(historicoQuery.error).message : null}
              onRetry={() => void historicoQuery.refetch()}
            />
          </SheetContent>
        </Sheet>
      ) : null}
      {canWrite && checklistsIbc ? (
        <IbcChecklistsVinculoDrawer
          identificador={checklistsIbc.identificador}
          state={vinculos}
          onClose={() => setChecklistsIbc(null)}
        />
      ) : null}
      {canWrite && inspecaoIbc ? (
        <IbcInspecaoDrawer key={inspecaoIbc.id} ibc={inspecaoIbc} onClose={() => setInspecaoIbc(null)} />
      ) : null}
      {inspecoesIbc ? <IbcInspecoesDrawer ibc={inspecoesIbc} onClose={() => setInspecoesIbc(null)} /> : null}
    </DefaultLayout>
  );
}
