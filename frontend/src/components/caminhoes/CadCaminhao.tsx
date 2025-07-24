import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from 'react-hook-form'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogClose, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";


const vehicleSchema = z.object({
    modelo: z.string().min(1, "Modelo é obrigatório"),
    eixos: z.number().min(1, "Informe ao menos 1 eixo"),
    eixos_carregado: z.number().int().min(0),
    eixos_vazio: z.number().int().min(0),
    pneus: z.number().int().min(1, "Quantidade inválida de pneus"),
    capacidade_kg: z.number().int().min(100, "Capacidade mínima de 100kg"),
    consumo_medio_km_l: z.number().positive("Deve ser positivo"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function CadCaminhoes() {
    const { register, handleSubmit, formState: { errors } } = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema),
    });


    function createVehicle(data: VehicleFormData) {
        console.log("Vehicle Data:", data);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Cadastrar Caminhão</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Caminhão</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do caminhão para cadastro.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(createVehicle)} className="space-y-4">
                    <div>
                        <Input {...register("modelo")} placeholder="Modelo" />
                        {errors.modelo && <span className="text-red-500 text-sm">{errors.modelo.message}</span>}
                    </div>

                    <div>
                        <Input {...register("eixos")} placeholder="Eixos" type="number" />
                        {errors.eixos && <span className="text-red-500 text-sm">{errors.eixos.message}</span>}
                    </div>

                    <div>
                        <Input {...register("eixos_carregado")} placeholder="Eixos Carregado" type="number" />
                        {errors.eixos_carregado && <span className="text-red-500 text-sm">{errors.eixos_carregado.message}</span>}
                    </div>

                    <div>
                        <Input {...register("eixos_vazio")} placeholder="Eixos Vazio" type="number" />
                        {errors.eixos_vazio && <span className="text-red-500 text-sm">{errors.eixos_vazio.message}</span>}
                    </div>

                    <div>
                        <Input {...register("pneus")} placeholder="Pneus" type="number" />
                        {errors.pneus && <span className="text-red-500 text-sm">{errors.pneus.message}</span>}
                    </div>

                    <div>
                        <Input {...register("capacidade_kg")} placeholder="Capacidade (kg)" type="number" />
                        {errors.capacidade_kg && <span className="text-red-500 text-sm">{errors.capacidade_kg.message}</span>}
                    </div>

                    <div>
                        <Input {...register("consumo_medio_km_l")} placeholder="Consumo Médio (km/l)" type="number" step="any" />
                        {errors.consumo_medio_km_l && <span className="text-red-500 text-sm">{errors.consumo_medio_km_l.message}</span>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">Cadastrar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
            );
}
