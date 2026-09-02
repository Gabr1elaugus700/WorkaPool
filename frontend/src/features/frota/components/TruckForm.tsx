import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";

const truckSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  capacity: z.preprocess(
    (value) =>
      value === "" || value === null || (typeof value === "number" && Number.isNaN(value))
        ? undefined
        : value,
    z
      .number({ required_error: "Capacidade é obrigatória" })
      .int()
      .positive("Capacidade inválida"),
  ),
  plate: z.string().min(1, "Placa é obrigatória").max(10),
  type: z.string().optional(),
  axles: z.preprocess(
    (value) =>
      value === "" || value === null || (typeof value === "number" && Number.isNaN(value))
        ? undefined
        : value,
    z.number().int().positive().optional(),
  ),
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
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [pendingData, setPendingData] = useState<TruckFormData | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      name: "",
      capacity: undefined,
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
      capacity: truck?.capacity ?? undefined,
      plate: truck?.plate ?? "",
      type: truck?.type ?? "",
      axles: truck?.axles ?? undefined,
      active: truck?.active ?? true,
    });
  }, [open, truck, reset]);

  const doSubmit = async (data: TruckFormData) => {
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

  const submit = async (data: TruckFormData) => {
    if (truck?.active && !data.active) {
      setPendingData(data);
      setConfirmDeactivate(true);
      return;
    }
    await doSubmit(data);
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingData) {
      return;
    }
    setConfirmDeactivate(false);
    await doSubmit(pendingData);
    setPendingData(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={truck ? "outline" : "default"} size="sm">
            {triggerLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{truck ? "Editar caminhão" : "Cadastrar caminhão"}</DialogTitle>
            <DialogDescription>
              Caminhões inativos não aparecem nas opções de despacho. Você pode reativá-los a
              qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium">Identificação</p>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Capacidade</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacidade (kg)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="25000"
                    {...register("capacity", { valueAsNumber: true })}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-destructive">{errors.capacity.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Input id="type" placeholder="Cavalo, carreta..." {...register("type")} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="axles">Eixos</Label>
                  <Input id="axles" type="number" {...register("axles", { valueAsNumber: true })} />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Usado para referência operacional.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Disponibilidade</p>
              <div className="flex items-start gap-3">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="active"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  )}
                />
                <div className="grid gap-1">
                  <Label htmlFor="active" className="cursor-pointer font-normal">
                    Caminhão ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Desmarque para impedir que este caminhão seja selecionado no despacho.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar caminhão?</AlertDialogTitle>
            <AlertDialogDescription>
              O caminhão &ldquo;{truck?.name}&rdquo; deixará de aparecer nas opções de despacho.
              Você pode reativá-lo editando o cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDeactivate()}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
