import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import CadastroIbcForm from "../components/CadastroIbcForm";
import CadastroIbcLoteForm from "../components/CadastroIbcLoteForm";
import IbcProdutosDrawer from "../components/IbcProdutosDrawer";
import CadastroIbcLoteWarningBanner from "../components/CadastroIbcLoteWarningBanner";
import CadastroIbcModeSelector, {
  type CadastroIbcMode,
} from "../components/CadastroIbcModeSelector";
import CadastroIbcPoolList from "../components/CadastroIbcPoolList";
import CadastroIbcAlertsPanel from "../components/CadastroIbcAlertsPanel";
import CadastroIbcSectionError from "../components/CadastroIbcSectionError";
import GestaoIbcHeader from "../components/GestaoIbcHeader";
import IbcStatusContent from "../components/IbcStatusContent";
import ConfirmarMudancaIbcModal, {
  type IbcMudancaModo,
} from "../components/ConfirmarMudancaIbcModal";
import IbcHistoricoDrawer from "../components/IbcHistoricoDrawer";
import IbcChecklistsVinculoDrawer from "../components/IbcChecklistsVinculoDrawer";
import IbcInspecaoDrawer from "../components/IbcInspecaoDrawer";
import IbcInspecoesDrawer from "../components/IbcInspecoesDrawer";
import {
  useCadastrarIbc,
  useIbcAlerts,
  useIbcPool,
  useIbcProdutos,
} from "../hooks/useIbcCadastro";
import { useIbcConversao, useIbcHistorico } from "../hooks/useIbcConversao";
import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import type {
  CreateLoteIbcResultDTO,
  IbcCadastroDTO,
} from "../types/ibcCadastro.types";
import {
  IBC_CADASTRO_VIEW_ROLES,
  canViewIbcCadastro,
  canWriteIbcCadastro,
} from "../utils/ibcCadastroPermissions";
import { toError } from "../utils/toError";

export default function CadastroIbcView() {
  const { user } = useAuth();
  const allowed = canViewIbcCadastro(user?.role);
  const canWrite = canWriteIbcCadastro(user?.role);
  const [mode, setMode] = useState<CadastroIbcMode>("unitario");
  const [mudanca, setMudanca] = useState<{
    ibc: IbcCadastroDTO;
    modo: IbcMudancaModo;
  } | null>(null);
  const [historicoIbc, setHistoricoIbc] = useState<IbcCadastroDTO | null>(null);
  const conversao = useIbcConversao();
  const historicoQuery = useIbcHistorico(historicoIbc?.id ?? null);
  const [checklistsIbc, setChecklistsIbc] = useState<IbcCadastroDTO | null>(null);
  const vinculos = useIbcChecklistVinculos(checklistsIbc?.id ?? null);
  const [inspecaoIbc, setInspecaoIbc] = useState<IbcCadastroDTO | null>(null);
  const [inspecoesIbc, setInspecoesIbc] = useState<IbcCadastroDTO | null>(null);
  const [incluirHistorico, setIncluirHistorico] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const [produtosAberto, setProdutosAberto] = useState(false);

  const poolQuery = useIbcPool(allowed, incluirHistorico);
  const alertsQuery = useIbcAlerts(allowed);
  const produtosQuery = useIbcProdutos(allowed);
  const cadastro = useCadastrarIbc();
  const createMutation = cadastro.unitario;
  const createLoteMutation = cadastro.lote;

  if (!allowed) {
    return (
      <ExpedicaoIbcAccessDeniedAlert
        targetPhrase="o Cadastro IBC"
        requiredRoles={IBC_CADASTRO_VIEW_ROLES}
      />
    );
  }

  const produtos = produtosQuery.data ?? [];
  const loteResult: CreateLoteIbcResultDTO | undefined =
    createLoteMutation.data;
  const submitting =
    createMutation.isPending || createLoteMutation.isPending;

  return (
    <DefaultLayout>
      <div className="space-y-6">
        <GestaoIbcHeader
          activeSection="containers"
          userRole={user?.role}
          secondaryActions={
            canWrite ? (
              <Button type="button" variant="outline" onClick={() => setProdutosAberto(true)}>
                Produtos
              </Button>
            ) : null
          }
          primaryAction={canWrite ? <Button type="button" onClick={() => setNovoAberto(true)}>Novo IBC</Button> : null}
        />
        {canWrite ? (
          <IbcProdutosDrawer open={produtosAberto} produtos={produtos} onOpenChange={setProdutosAberto} />
        ) : null}
        <p className="max-w-prose text-sm text-muted-foreground">
            {canWrite
              ? "Novo IBC nasce Apto, com alerta Sem inspeção até a primeira inspeção, e identificador HM + letra do produto. Lote de compra gera N unidades com a mesma data limite. Conversão e mudança de produto criam um novo registro."
              : "Consulta do pool, dos alertas e do histórico de inspeções de IBC."}
        </p>

        {canWrite ? (
          <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
          <DialogContent
            className="left-auto right-0 top-0 flex h-screen max-h-screen w-full max-w-2xl translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none border-y-0 border-r-0 sm:rounded-none"
            style={{ left: "auto", right: 0, top: 0, bottom: 0, height: "100vh", transform: "none" }}
          >
            <DialogHeader>
              <DialogTitle>Novo IBC</DialogTitle>
              <DialogDescription>Cadastro unitário ou em lote.</DialogDescription>
            </DialogHeader>
            <CadastroIbcModeSelector
              mode={mode}
              disabled={submitting}
              onChange={setMode}
            />
            {!produtosQuery.isLoading && produtos.length === 0 ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <p className="text-muted-foreground">Cadastre ao menos um produto para liberar o cadastro de IBC.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovoAberto(false);
                    setProdutosAberto(true);
                  }}
                >
                  Abrir produtos
                </Button>
              </div>
            ) : null}
            {mode === "unitario" ? (
              <CadastroIbcForm
                submitting={createMutation.isPending}
                produtos={produtos}
                onSubmit={async ({ dataLimite, produtoId }) => {
                  await createMutation.mutateAsync({ dataLimite, produtoId });
                }}
              />
            ) : (
              <CadastroIbcLoteForm
                submitting={createLoteMutation.isPending}
                produtos={produtos}
                onSubmit={async (input) => {
                  await createLoteMutation.mutateAsync(input);
                }}
              />
            )}
            {mode === "unitario" &&
            createMutation.isSuccess &&
            createMutation.data ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  IBC cadastrado:{" "}
                  <span className="font-semibold text-foreground">
                    {createMutation.data.identificador}
                  </span>
                </p>
              </div>
            ) : null}
            {mode === "lote" && createLoteMutation.isSuccess && loteResult ? (
              <>
                <div
                  role="status"
                  className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p>
                      Lote cadastrado:{" "}
                      <span className="font-semibold text-foreground">
                        {loteResult.items.length} IBCs
                      </span>
                      {loteResult.lote.numeroNf
                        ? ` · NF ${loteResult.lote.numeroNf}`
                        : null}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {loteResult.items.map((item) => item.identificador).join(", ")}
                    </p>
                  </div>
                </div>
                {loteResult.warning ? (
                  <CadastroIbcLoteWarningBanner warning={loteResult.warning} />
                ) : null}
              </>
            ) : null}
          </DialogContent>
          </Dialog>
        ) : null}

        {alertsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando alertas…</p>
        ) : alertsQuery.error ? (
          <CadastroIbcSectionError
            message={toError(alertsQuery.error).message}
            onRetry={() => {
              void alertsQuery.refetch();
            }}
          />
        ) : (
          <CadastroIbcAlertsPanel alerts={alertsQuery.data ?? []} />
        )}

        {poolQuery.isLoading ? (
          <IbcStatusContent status="loading" loadingLabel="Carregando containers…" />
        ) : poolQuery.error ? (
          <div className="space-y-3">
            <IbcStatusContent status="error" error={toError(poolQuery.error)} />
            <Button type="button" variant="outline" size="sm" onClick={() => void poolQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <CadastroIbcPoolList
            items={poolQuery.data ?? []}
            produtos={produtos}
            canWrite={canWrite}
            incluirHistorico={incluirHistorico}
            onIncluirHistoricoChange={setIncluirHistorico}
            emptyMessage={incluirHistorico ? "Nenhum IBC no histórico." : "Nenhum IBC ativo no pool."}
            emptyNextStep={incluirHistorico ? "O histórico reúne baixados e substituídos." : canWrite ? "Use Novo IBC para cadastrar o primeiro container." : "Quando o almox cadastrar um IBC, ele aparece nesta tabela."}
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
      {canWrite && mudanca ? (
        <ConfirmarMudancaIbcModal
          key={`${mudanca.ibc.id}-${mudanca.modo}`}
          ibc={mudanca.ibc}
          modo={mudanca.modo}
          produtos={produtos}
          submitting={conversao.isPending}
          onClose={() => setMudanca(null)}
          onConfirm={async ({ confirmacao, produtoId }) => {
            if (mudanca.modo === "product_change" && produtoId) {
              await conversao.mudarProduto(mudanca.ibc.id, {
                ...confirmacao,
                produtoId,
              });
            } else {
              await conversao.converter(mudanca.ibc.id, confirmacao);
            }
            setMudanca(null);
          }}
        />
      ) : null}
      {historicoIbc ? (
        <IbcHistoricoDrawer
          identificador={historicoIbc.identificador}
          eventos={historicoQuery.data ?? []}
          isLoading={historicoQuery.isLoading}
          errorMessage={
            historicoQuery.error ? toError(historicoQuery.error).message : null
          }
          onRetry={() => {
            void historicoQuery.refetch();
          }}
          onClose={() => setHistoricoIbc(null)}
        />
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
      {inspecoesIbc ? (
        <IbcInspecoesDrawer ibc={inspecoesIbc} onClose={() => setInspecoesIbc(null)} />
      ) : null}
    </DefaultLayout>
  );
}
