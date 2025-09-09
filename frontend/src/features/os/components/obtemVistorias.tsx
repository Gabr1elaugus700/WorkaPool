import { useEffect, useState } from "react";
import { departamentosService } from '@/features/departamentos/services/departamentosService';
import { Card } from "@/components/ui/card";
import { Departamento } from "@/features/departamentos/models/departamentosModel";
// import { CalendarDays } from 'lucide-react';
import { clsx } from "clsx";
import { Plus } from "lucide-react";

export default function DepartamentosList() {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

    useEffect(() => {
        const fetchDepartamentos = async () => {
            const departamentos = await departamentosService.getAll();
            setDepartamentos(departamentos);
        };
        fetchDepartamentos();
    }, []);

    return (
        <div className="p-2">
            <h1 className="font-semibold text-lg mb-1 text-center sm:text-left">Departamentos:</h1>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {departamentos.map((departamento: Departamento) => {
                    // Cor padrão para todos os departamentos
                    const bgColor = "bg-primary/20 border-primary/50 border-2"; // azul

                    return (
                        <Card
                            key={departamento.id}
                            className={clsx(
                                "p-1 w-full border rounded-sm shadow-md transition-colors text-sm",
                                bgColor
                            )}
                        >
                            <div className="flex items-center justify-start">
                                <button>
                                    <Plus className="h-4 w-4 text-primary" />
                                </button>
                                <h2 className="font-semibold text-lg ml-2">Departamento: {departamento.name}</h2>
                            </div>
                        </Card>
                    );
                })}
            </section>


        </div>
    );
}

