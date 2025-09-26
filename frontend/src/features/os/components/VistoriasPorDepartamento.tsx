import { useEffect, useState } from "react";
import { departamentosService } from '@/features/departamentos/services/departamentosService';
// import { Card } from "@/components/ui/card";
import { Departamento } from "@/features/departamentos/models/departamentosModel";
import { clsx } from "clsx";
import { Vistoria } from "../models/vistoriasModel";
import { vistoriasService } from "../services/vistoriasService";
import ButtonRegistrarVistoria from "./botaoRegistrarVistoria";
import { Card, CardTitle } from "@/components/ui/card";
import ModalVisualizarVistoria from "./modalVisualizarVistoria";

export interface VistoriasDepartamentoProps {
    onClose: () => void;
}

const VistoriasPorDepartamento: React.FC<VistoriasDepartamentoProps> = () => {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [vistorias, setVistorias] = useState<Vistoria[]>([]);
    const [modalVistoriaId, setModalVistoriaId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDepartamentos = async () => {
            const departamentos = await departamentosService.getAll();
            setDepartamentos(departamentos);
        };
        fetchDepartamentos();
        const fetchVistoriasDepartamento = async () => {

            const todasVistorias = await vistoriasService.getAll();
            setVistorias(todasVistorias);

        };
        fetchVistoriasDepartamento();
    }, []);

    const atualizarVistorias = async () => {
        const todasVistorias = await vistoriasService.getAll();
        setVistorias(todasVistorias);
    };
    return (
        <div className="p-2">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {departamentos.map((departamento: Departamento) => {
                    const vistoriasDoDepartamento = vistorias.filter(
                        (v) => v.vistoria_dpto?.id === departamento.id
                    );
                    return (
                        <Card key={departamento.id} className={clsx(
                            "bg-white/50 dark:bg-black/20 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300",
                            "border-x-2 border-y-2 border-gray-200 dark:border-gray-700"
                        )}>
                            <CardTitle className="flex items-center justify-between mb-2 ">
                                <span className="text-lg font-bold text-gray-900 leading-snug">
                                    {departamento.name.charAt(0).toUpperCase() + departamento.name.slice(1).toLowerCase()}
                                </span>

                                <ButtonRegistrarVistoria
                                    departamentoId={departamento.id?.toString()}
                                    onVistoriaCriada={atualizarVistorias}
                                />
                            </CardTitle>

                            <div>
                                {vistoriasDoDepartamento.length > 0 ? (
                                    vistoriasDoDepartamento
                                        .slice(0, 3)
                                        .map((v) => (

                                            <>
                                                <Card
                                                    key={v.id}
                                                    className="p-2 bg-gray-100 rounded-md lg:text-sm cursor-pointer hover:bg-gray-200 transition"
                                                    onClick={() => setModalVistoriaId(v.id)}
                                                >
                                                    Realizado por: {v.responsavel?.name} | Data: {new Date(v.data_vistoria).toLocaleDateString()}
                                                </Card>
                                                {modalVistoriaId === v.id && (
                                                    <ModalVisualizarVistoria
                                                        open={!!modalVistoriaId}
                                                        onOpenChange={(open) => open ? setModalVistoriaId(v.id) : setModalVistoriaId(null)}
                                                        vistoriaId={v.id}
                                                    />
                                                )}
                                            </>
                                        ))
                                ) : (
                                    <li className="text-sm ">
                                        Nenhuma vistoria encontrada.
                                    </li>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </section>

        </div>
    );
};

export default VistoriasPorDepartamento;

