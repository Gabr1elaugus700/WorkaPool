import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCadastrarIbc } from "../hooks/useIbcCadastro";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";
import CadastroIbcForm from "./CadastroIbcForm";
import CadastroIbcLoteForm from "./CadastroIbcLoteForm";
import CadastroIbcResultado from "./CadastroIbcResultado";
import IbcSegmentedControl from "./IbcSegmentedControl";

type Modo = "unitario" | "lote";

const MODOS: readonly { id: Modo; label: string }[] = [
  { id: "unitario", label: "Unitário" },
  { id: "lote", label: "Lote de compra" },
];

type Props = {
  open: boolean;
  config: ListaIbcProdutoConfig | null;
  configCarregando: boolean;
  configErro: string | null;
  onOpenChange: (open: boolean) => void;
  onAbrirProdutos: () => void;
};

export default function NovoIbcDrawer({
  open,
  config,
  configCarregando,
  configErro,
  onOpenChange,
  onAbrirProdutos,
}: Props) {
  const [modo, setModo] = useState<Modo>("unitario");
  const cadastro = useCadastrarIbc();
  const grupos = ibcPlacaCadastro.grupos(config);
  const universalCor = ibcPlacaCadastro.universalCor(config);
  const semPlaca = !configCarregando && !configErro && grupos.length === 0 && universalCor == null;
  const falha = modo === "unitario" ? cadastro.unitario.error : cadastro.lote.error;

  let notice: ReactNode = null;
  if (configErro || falha) {
    notice = <p role="alert" className="text-sm text-destructive">{configErro ?? (falha instanceof Error ? falha.message : "Falha ao cadastrar IBC")}</p>;
  } else if (semPlaca) {
    notice = (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
        <p className="text-muted-foreground">Configure sigla e cor de um grupo, ou a placa universal, para cadastrar um IBC.</p>
        <Button type="button" variant="outline" size="sm" onClick={onAbrirProdutos}>
          Abrir produtos
        </Button>
      </div>
    );
  } else if (modo === "unitario" && cadastro.unitario.data) {
    notice = <CadastroIbcResultado modo="unitario" ibc={cadastro.unitario.data} />;
  } else if (modo === "lote" && cadastro.lote.data) {
    notice = <CadastroIbcResultado modo="lote" result={cadastro.lote.data} />;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width="lg">
        <SheetHeader className="gap-3">
          <div className="space-y-1.5">
            <SheetTitle>Novo IBC</SheetTitle>
            <SheetDescription>
              Nasce Apto, com alerta Sem inspeção até a primeira inspeção. O prefixo é HM ou NH mais a sigla; o universal é só NH.
            </SheetDescription>
          </div>
          <div>
            <IbcSegmentedControl
              ariaLabel="Tipo de cadastro"
              options={MODOS}
              value={modo}
              disabled={cadastro.isPending}
              onChange={setModo}
            />
          </div>
        </SheetHeader>
        {modo === "unitario" ? (
          <CadastroIbcForm
            grupos={grupos}
            universalCorHex={universalCor}
            disabled={semPlaca || configCarregando || Boolean(configErro)}
            submitting={cadastro.unitario.isPending}
            notice={notice}
            onSubmit={async (input) => {
              await cadastro.unitario.mutateAsync(input);
            }}
          />
        ) : (
          <CadastroIbcLoteForm
            grupos={grupos}
            universalCorHex={universalCor}
            disabled={semPlaca || configCarregando || Boolean(configErro)}
            submitting={cadastro.lote.isPending}
            notice={notice}
            onSubmit={async (input) => {
              await cadastro.lote.mutateAsync(input);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
