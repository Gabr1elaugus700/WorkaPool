import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useForm } from 'react-hook-form'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogClose, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { getParametrosFrete, updateParametrosFrete } from "@/services/useParametrosFretesService";
import { useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Pencil } from "lucide-react";
import { useEffect } from "react";
// import { data } from "react-router-dom";

const parametrosSchema = z.object({
    valor_diesel_s10_sem_icms: z.number().min(0, "Valor inválido"),
    valor_diesel_s10_com_icms: z.number().min(0, "Valor inválido"),
    valor_salario_motorista_dia: z.number().min(0, "Valor inválido"),
    valor_refeicao_motorista_dia: z.number().min(0, "Valor inválido"),
    valor_ajuda_custo_motorista: z.number().min(0, "Valor inválido"),
    valor_chapa_descarga: z.number().min(0, "Valor inválido"),
    valor_desgaste_pneus: z.number().min(0, "Valor inválido"),
});

type ParametrosFormData = z.infer<typeof parametrosSchema>;

export default function CadParametros() {
    const [open, setOpen] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ParametrosFormData>({
        resolver: zodResolver(parametrosSchema),
    });

    // function createParametros(data: ParametrosFormData) {
    //     console.log("Dados do formulário:", data);
    //     fetchParametrosFrete(data.valor_diesel_s10_sem_icms, data.valor_diesel_s10_com_icms, data.valor_salario_motorista_dia, data.valor_refeicao_motorista_dia, data.valor_ajuda_custo_motorista, data.valor_chapa_descarga, data.valor_desgaste_pneus)
    //         .then(response => {
    //             console.log("Parâmetros de frete cadastrados com sucesso:", response);
    //             setOpen(false); // Fecha o modal após o cadastro
    //         })
    //         .catch(error => {
    //             console.error("Erro ao cadastrar parâmetros de frete:", error);
    //         });
    // }

    function updateParametros(data: ParametrosFormData) {
        console.log("Dados do formulário:", data);
        updateParametrosFrete(data.valor_diesel_s10_sem_icms, data.valor_diesel_s10_com_icms, data.valor_salario_motorista_dia, data.valor_refeicao_motorista_dia, data.valor_ajuda_custo_motorista, data.valor_chapa_descarga, data.valor_desgaste_pneus)
            .then(response => {
                console.log("Parâmetros de frete atualizados com sucesso:", response);
                setOpen(false); // Fecha o modal após a atualização
            })
            .catch(error => {
                console.error("Erro ao atualizar parâmetros de frete:", error);
            });
    }

    async function getParametros() {
        return await getParametrosFrete()
            .then(response => {
                console.log("Parâmetros de frete obtidos com sucesso:", response);
                return response;
            })
            .catch(error => {
                console.error("Erro ao obter parâmetros de frete:", error);
                throw error;
            });
    }

    useEffect(() => {
        if (open) {
            getParametros()
                .then((data: ParametrosFormData) => {
                    console.log("Parâmetros obtidos:", data);
                    reset(data); // Reseta o formulário com os dados obtidos
                })
                .catch((error) => {
                    console.error("Erro ao obter parâmetros:", error);
                });
        }
    }, [open, reset]);

            return (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">Editar Parâmetros De Frete
                            <Pencil className="w-4 h-4 ml-2" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Parâmetros De Frete</DialogTitle>
                            <DialogDescription>
                                Altere os Campos Necessários.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(updateParametros)} className="space-y-4">
                            <div>
                                <Label>Valor Diesel S10 Sem ICMS</Label>
                                <Input {...register("valor_diesel_s10_sem_icms", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_diesel_s10_sem_icms && <span className="text-red-500 text-sm">{errors.valor_diesel_s10_sem_icms.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Diesel S10 Com ICMS</Label>
                                <Input {...register("valor_diesel_s10_com_icms", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_diesel_s10_com_icms && <span className="text-red-500 text-sm">{errors.valor_diesel_s10_com_icms.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Salário Motorista Dia</Label>
                                <Input {...register("valor_salario_motorista_dia", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_salario_motorista_dia && <span className="text-red-500 text-sm">{errors.valor_salario_motorista_dia.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Refeição Motorista Dia</Label>
                                <Input {...register("valor_refeicao_motorista_dia", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_refeicao_motorista_dia && <span className="text-red-500 text-sm">{errors.valor_refeicao_motorista_dia.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Ajuda Custo Motorista</Label>
                                <Input {...register("valor_ajuda_custo_motorista", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_ajuda_custo_motorista && <span className="text-red-500 text-sm">{errors.valor_ajuda_custo_motorista.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Chapa Descarga</Label>
                                <Input {...register("valor_chapa_descarga", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_chapa_descarga && <span className="text-red-500 text-sm">{errors.valor_chapa_descarga.message}</span>}
                            </div>

                            <div>
                                <Label>Valor Desgaste Pneus</Label>
                                <Input {...register("valor_desgaste_pneus", { valueAsNumber: true })} type="number" step="any" />
                                {errors.valor_desgaste_pneus && <span className="text-red-500 text-sm">{errors.valor_desgaste_pneus.message}</span>}
                            </div>

                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancelar</Button>
                                </DialogClose>
                                <Button type="submit">Atualizar Informações</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            );
        }
