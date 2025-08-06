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
import { Carga as Cargas } from "@/types/cargas";
import { getBaseUrl } from "@/lib/apiBase";

type Props = {
  carga: Cargas;
  onUpdated: (nova: Cargas) => void;
  onChangeSituacao?: (id: string, novaSituacao: string) => void;
};

export function EditarCargaModal({ carga, onUpdated, onChangeSituacao }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ...carga,
    previsaoSaida: new Date(carga.previsaoSaida).toISOString().slice(0, 10),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "pesoMax" || name === "custoMin" ? Number(value) : value,
    }));
  };

  // Implementando a função handleSituacaoChange
  const handleSituacaoChange = (value: string) => {
    setForm((prev) => ({ ...prev, situacao: value }));
  };

  const atualizarCarga = async () => {
    try {
      // Verificar se houve mudança na situação
      const situacaoMudou = form.situacao !== carga.situacao;
      const novaSituacao = form.situacao;

      // Atualizar a carga usando um fetch direto
      const res = await fetch(`${getBaseUrl()}/api/Cargas/${carga.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const atualizada = await res.json();
      setOpen(false);

      const cargaAtualizada = {
        ...atualizada,
        pedidos: carga.pedidos ?? [],
        pesoAtual: carga.pesoAtual ?? 0,
      };

      onUpdated(cargaAtualizada);

      // Se a situação mudou para FECHADA e existe o callback onChangeSituacao, chamá-lo
      if (situacaoMudou && novaSituacao === "FECHADA" && onChangeSituacao) {
        console.log("Situação alterada para FECHADA - chamando onChangeSituacao");
        onChangeSituacao(carga.id, novaSituacao);
      }
    } catch (error) {
      console.error("Erro ao atualizar carga:", error);
    }
  };

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
              name="pesoMax"
              type="number"
              value={form.pesoMax}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Custo Mínimo (R$)</Label>
            <Input
              name="custoMin"
              type="number"
              value={form.custoMin}
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
                <SelectItem value="ABERTA">ABERTA</SelectItem>
                <SelectItem value="FECHADA">FECHADA</SelectItem>
                <SelectItem value="SOLICITADA">SOLICITADA</SelectItem>
                <SelectItem value="CANCELADA">CANCELADA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={atualizarCarga} className="w-full">
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}