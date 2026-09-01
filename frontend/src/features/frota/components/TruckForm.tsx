import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";

const truckSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  capacity: z.coerce.number().int().positive("Capacidade inválida"),
  plate: z.string().min(1, "Placa é obrigatória").max(10),
  type: z.string().optional(),
  axles: z.coerce.number().int().positive().optional(),
  active: z.boolean().default(true),
});

type TruckFormData = z.infer<typeof truckSchema>;

type Props = {
  truck?: FleetTruck;
  onSubmit: (data: CreateFleetTruckInput) => Promise<void>;
  triggerLabel: string;
};

export function TruckForm({ truck, onSubmit, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      plate: "",
      type: "",
      axles: undefined,
      active: true,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset({
      name: truck?.name ?? "",
      capacity: truck?.capacity ?? 0,
      plate: truck?.plate ?? "",
      type: truck?.type ?? "",
      axles: truck?.axles ?? undefined,
      active: truck?.active ?? true,
    });
  }, [open, truck, reset]);

  const submit = async (data: TruckFormData) => {
    setSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        capacity: data.capacity,
        plate: data.plate,
        type: data.type || undefined,
        axles: data.axles,
        active: data.active,
      });
      setOpen(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={truck ? "outline" : "default"} size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{truck ? "Editar caminhão" : "Cadastrar caminhão"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plate">Placa</Label>
            <Input id="plate" {...register("plate")} />
            {errors.plate && (
              <p className="text-sm text-destructive">{errors.plate.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">Capacidade (kg)</Label>
            <Input id="capacity" type="number" {...register("capacity")} />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Input id="type" {...register("type")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="axles">Eixos</Label>
            <Input id="axles" type="number" {...register("axles")} />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" {...register("active")} />
            <Label htmlFor="active">Ativo</Label>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
