import { useState } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import CadastroIbcSectionError from "../components/CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "../components/CadastroIbcSectionSkeleton";
import GestaoIbcHeader from "../components/GestaoIbcHeader";
import IbcProdutoConfigLista, { type IbcProdutoConfigAlvo } from "../components/IbcProdutoConfigLista";
import IbcProdutoConfigModal, { type IbcProdutoConfigEdicao } from "../components/IbcProdutoConfigModal";
import { useIbcProdutoConfig } from "../hooks/useIbcProdutoConfig";
import { IBC_CADASTRO_VIEW_ROLES, canViewIbcCadastro, canWriteIbcCadastro } from "../utils/ibcCadastroPermissions";
import { toError } from "../utils/toError";

export default function IbcProdutoConfigView() {
  const { user } = useAuth();
  const allowed = canViewIbcCadastro(user?.role);
  const canWrite = canWriteIbcCadastro(user?.role);
  const config = useIbcProdutoConfig(allowed);
  const [alvo, setAlvo] = useState<IbcProdutoConfigAlvo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const lista = config.query.data;
  const fechar = () => { setAlvo(null); setErro(null); };

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert targetPhrase="a configuração de produto" requiredRoles={IBC_CADASTRO_VIEW_ROLES} />;
  }

  const edicao: IbcProdutoConfigEdicao | null = !alvo || !lista ? null : alvo.tipo === "universal"
    ? { tipo: "universal", item: lista.universal }
    : { tipo: "grupo", item: alvo.grupo };

  return (
    <DefaultLayout>
      <div className="space-y-4">
        <GestaoIbcHeader activeSection="produtos" userRole={user?.role} />
        <p className="max-w-prose text-sm text-muted-foreground">
          Sigla e cor da placa por grupo do Sapiens. A linha Universal fica no topo e vale para o container lavado entre usos.
        </p>
        {config.query.isLoading ? <CadastroIbcSectionSkeleton rows={6} /> : config.query.error ? (
          <CadastroIbcSectionError message={toError(config.query.error).message} onRetry={() => { void config.query.refetch(); }} />
        ) : lista ? (
          <IbcProdutoConfigLista lista={lista} canWrite={canWrite} onEditar={(next) => { setErro(null); setAlvo(next); }} />
        ) : null}
      </div>
      {canWrite && edicao ? (
        <Dialog open onOpenChange={(open) => { if (!open && !config.save.isPending) fechar(); }}>
          <DialogContent className="max-w-md gap-5" aria-labelledby="placa-titulo" aria-describedby="placa-descricao">
            <IbcProdutoConfigModal
              key={edicao.tipo === "grupo" ? edicao.item.grupoCodigo : "universal"}
              alvo={edicao}
              erro={erro}
              saving={config.save.isPending}
              onClose={fechar}
              onSave={async (input) => {
                try {
                  await config.save.mutateAsync(input);
                  fechar();
                } catch (err) {
                  setErro(toError(err).message);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </DefaultLayout>
  );
}
