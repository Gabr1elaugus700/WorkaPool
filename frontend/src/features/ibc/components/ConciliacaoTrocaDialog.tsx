import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IbcProdutoSelect from "./IbcProdutoSelect";
import { ibcCadastroService } from "../services/ibcCadastroService";
import { conciliacaoViagemService } from "../services/conciliacaoViagemService";
import { toError } from "../utils/toError";

type Props = {
  codCar: number;
  alocacaoIbcId: string;
  identificador: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrada: (ibcEntradaId: string, identificador: string) => void;
};

function hojeLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function ConciliacaoTrocaDialog({
  codCar,
  alocacaoIbcId,
  identificador,
  open,
  onOpenChange,
  onRegistrada,
}: Props) {
  const produtos = useQuery({ queryKey: ["ibc", "produtos"], queryFn: ibcCadastroService.listProdutos, enabled: open });
  const [produtoId, setProdutoId] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const minDate = hojeLocal();
  const dataInvalida = Boolean(dataLimite && dataLimite < minDate);

  const registrar = async () => {
    if (!produtoId || !dataLimite || dataInvalida) {
      setErro("Escolha o produto e uma data limite de hoje em diante.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const troca = await conciliacaoViagemService.registrarTroca(codCar, {
        alocacaoIbcId,
        produtoId,
        dataLimite,
      });
      onRegistrada(troca.ibcEntradaId, troca.identificador);
      onOpenChange(false);
    } catch (err) {
      setErro(toError(err).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar a troca de {identificador}</DialogTitle>
          <DialogDescription>
            O IBC que entrou recebe identificador novo, fica inapto e só entra no pátio quando a viagem fechar.
          </DialogDescription>
        </DialogHeader>
        {produtos.isError ? <p className="text-sm text-destructive">{toError(produtos.error).message}</p> : null}
        <IbcProdutoSelect
          id="troca-produto"
          produtos={produtos.data ?? []}
          value={produtoId}
          disabled={enviando || produtos.isLoading}
          onChange={setProdutoId}
        />
        <div className="space-y-1.5">
          <Label htmlFor="troca-data-limite" className="text-xs">Data limite de uso</Label>
          <Input
            id="troca-data-limite"
            type="date"
            min={minDate}
            value={dataLimite}
            disabled={enviando}
            onChange={(event) => setDataLimite(event.target.value)}
          />
        </div>
        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={enviando} onClick={() => void registrar()}>Registrar entrada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
