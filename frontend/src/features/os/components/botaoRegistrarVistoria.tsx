import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Vistoria } from "../models/vistoriasModel";
import { vistoriasService } from "../services/vistoriasService";

interface ButtonRegistrarVistoriaProps {
    departamentoId?: string;
    descricao?: string;
}

export default function ButtonRegistrarVistoria({ departamentoId, descricao }: ButtonRegistrarVistoriaProps) {
    const [open, setOpen] = useState(false);
    const [vistorias, setVistorias] = useState<Vistoria[]>([]);

    useEffect(() => {
        if (open && departamentoId) {
            vistoriasService.getVistoriasByDepartamentoId(departamentoId).then(setVistorias);
        } else if (!departamentoId) {
            setVistorias([]);
        }
    }, [open, departamentoId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>{descricao}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-full w-full sm:max-w-lg p-4 rounded-lg">
                <DialogHeader>
                    <DialogTitle>
                        {departamentoId
                            ? `Vistorias do Departamento: ${vistorias[0]?.vistoria_dpto?.name || ''}`
                            : "Vistorias"}
                    </DialogTitle>
                </DialogHeader>
                {departamentoId ? (
                    vistorias.length === 0 ? (
                        <span className="text-yellow-600">Nenhuma vistoria encontrada para este departamento.</span>
                    ) : (
                        <>
                            <div className="mb-2 font-medium">Últimas vistorias:</div>
                            <ul>
                                {[...vistorias]
                                    .sort((a, b) => new Date(b.data_vistoria).getTime() - new Date(a.data_vistoria).getTime())
                                    .slice(0, 5)
                                    .map((v) => (
                                        <li key={v.id}>
                                            Responsável: {v.responsavel?.name} | Data: {new Date(v.data_vistoria).toLocaleDateString()}
                                        </li>
                                    ))}
                            </ul>
                        </>
                    )
                ) : (
                    <span className="text-gray-500">Selecione um departamento para ver as vistorias.</span>
                )}
            </DialogContent>
        </Dialog>
    );
}