import { useEffect, useState } from "react";
import { vistoriasService } from "../services/vistoriasService";
import { Card } from "@/components/ui/card";
import { Vistoria } from "../models/vistoriasModel";
import { CalendarDays } from 'lucide-react';
import { clsx } from "clsx";

export default function VistoriasList() {
    const [vistorias, setVistorias] = useState<Vistoria[]>([]);

    useEffect(() => {
        const fetchVistorias = async () => {
            const vistorias = await vistoriasService.getAll();
            setVistorias(vistorias);
        };
        fetchVistorias();
    }, []);

    return (
        <div className="p-2">
            <h1 className="font-semibold text-lg mb-1 text-center sm:text-left">Vistorias Por Departamentos:</h1>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">


                {vistorias.map((vistoria: Vistoria) => {
                    const diasRestantes = Math.ceil(
                        (new Date(vistoria.data_vistoria).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    let bgColor = "bg-emerald-100 border-emerald-300 border-2"; // verde
                    if (diasRestantes <= 10) {
                        bgColor = "bg-red-200 border-red-400 border-2"; // vermelho
                    } else if (diasRestantes <= 20) {
                        bgColor = "bg-yellow-200 border-yellow-400 border-2"; // amarelo
                        }
                        return (
                        <Card
                            key={vistoria.id}
                            className={clsx(
                                "p-4 mb-4 w-full border rounded-lg shadow-md cursor-move transition-colors text-sm space-y-1",
                                bgColor
                            )}
                        >
                            <div className="mr-3 flex-shrink-0 flex items-center justify-center bg-primary/90 rounded-full w-10 h-10">
                                <CalendarDays className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">Departamento: {vistoria.vistoria_dpto?.name}</h2>
                                <p>Responsável: {vistoria.responsavel?.name}</p>
                                <p>Próxima Vistoria: {new Date(vistoria.data_vistoria).toLocaleDateString()}</p>
                            </div>
                        </Card>
                    );
                })}

            </section>


        </div>
    );
}

