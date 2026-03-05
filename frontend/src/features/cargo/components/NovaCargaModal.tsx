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
import { useAuth } from "@/auth/AuthContext";
import { PackagePlus } from "lucide-react";
import { createCarga } from "../services";
import { Carga } from "../types/cargo.types";

type Props = {
  onCreated: (novaCarga: Carga) => void;
};

export function NovaCargaModal({ onCreated }: Props) {
  const { user } = useAuth();

  const situacao =
    user?.role === "ADMIN" || user?.role === "LOGISTICA"
      ? "ABERTA"
      : "SOLICITADA";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    destino: "",
    pesoMaximo: 10000,
    situacao,
    previsaoSaida: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: string | number = value;
    if (name === "pesoMaximo") {
      newValue = Number(value);
    }
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const criarCarga = async () => {
    const nova = await createCarga(form);
    onCreated(nova);
    setForm({
      destino: "",
      pesoMaximo: 10000,
      situacao,
      previsaoSaida: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <PackagePlus className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova carga</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label>Destino</Label>
            <Input
              name="destino"
              value={form.destino}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Previsão Saída da Carga</Label>
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

          <Button onClick={criarCarga} className="w-full">
            Criar Carga
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
