import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import {
  Carga,
  CargaDespachoCloseInput,
  CargaSituacao,
} from "../types/cargo.types";
import { cargoService } from "../services/cargoService";
import { toast } from "sonner";
import { FecharCargaDespachoFields } from "./FecharCargaDespachoFields";

type Props = {
  carga: Carga;
  onUpdated: (nova: Carga) => void;
  onChangeSituacao?: (
    id: string,
    novaSituacao: CargaSituacao,
    despacho?: CargaDespachoCloseInput,
  ) => void;
};

export function EditarCargaModal({ carga, onUpdated, onChangeSituacao }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ...carga,
    previsaoSaida: new Date(carga.previsaoSaida).toISOString().slice(0, 10),
  });
  const [motoristaId, setMotoristaId] = useState("");
  const [caminhaoId, setCaminhaoId] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "pesoMaximo" ? Number(value) : value,
    }));
  };

  const handleSituacaoChange = (value: CargaSituacao) => {
    setForm((prev) => ({ ...prev, situacao: value }));
    if (value !== CargaSituacao.FECHADA) {
      setMotoristaId("");
      setCaminhaoId("");
    }
  };

  const atualizarCarga = async () => {
    try {
      const situacaoMudou = form.situacao !== carga.situacao;
      const novaSituacao = form.situacao;

      const pesoMaximo = Number(form.pesoMaximo);
      if (isNaN(pesoMaximo) || pesoMaximo <= 0) {
        toast.error("Peso máximo deve ser um número válido maior que zero");
        return;
      }

      if (situacaoMudou && novaSituacao === CargaSituacao.FECHADA) {
        if (!carga.codCar) {
          toast.error("Carga sem código válido");
          return;
        }

        if (!motoristaId || !caminhaoId) {
          toast.error("Selecione motorista e caminhão para fechar a carga");
          return;
        }

        setOpen(false);

        if (onChangeSituacao) {
          onChangeSituacao(carga.id, novaSituacao, {
            motoristaId,
            caminhaoId,
          });
        }

        return;
      }

      const atualizada = await cargoService.updateCarga(carga.id, {
        destino: form.destino,
        pesoMax: pesoMaximo,
        previsaoSaida: form.previsaoSaida,
        situacao: form.situacao,
      });

      setOpen(false);

      const cargaAtualizada: Carga = {
        ...atualizada,
        situacao: atualizada.situacao as CargaSituacao,
        pedidos: carga.pedidos ?? [],
        pesoAtual: carga.pesoAtual ?? 0,
      };

      onUpdated(cargaAtualizada);
      toast.success("Carga atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar carga:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar carga");
    }
  };

  const precisaDespacho =
    form.situacao === CargaSituacao.FECHADA && form.situacao !== carga.situacao;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="mr-2">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Carga</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label>Destino</Label>
            <Input name="destino" value={form.destino} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label>Previsão de Saída</Label>
            <Input
              name="previsaoSaida"
              type="date"
              value={form.previsaoSaida}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Peso Máximo (kg)</Label>
            <Input
              name="pesoMaximo"
              type="number"
              value={form.pesoMaximo}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Situação</Label>
            <Select value={form.situacao} onValueChange={handleSituacaoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CargaSituacao.ABERTA}>ABERTA</SelectItem>
                <SelectItem value={CargaSituacao.FECHADA}>FECHADA</SelectItem>
                <SelectItem value={CargaSituacao.SOLICITADA}>SOLICITADA</SelectItem>
                <SelectItem value={CargaSituacao.CANCELADA}>CANCELADA</SelectItem>
                <SelectItem value={CargaSituacao.ENTREGUE}>ENTREGUE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {precisaDespacho ? (
            <FecharCargaDespachoFields
              motoristaId={motoristaId}
              caminhaoId={caminhaoId}
              onMotoristaChange={setMotoristaId}
              onCaminhaoChange={setCaminhaoId}
            />
          ) : null}

          <Button onClick={atualizarCarga} className="w-full">
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
