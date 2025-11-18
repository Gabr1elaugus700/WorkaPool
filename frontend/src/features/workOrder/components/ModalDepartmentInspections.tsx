import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { vistoriasService } from "../services/inspection.service";
import { useEffect, useState } from "react";
import { Vistoria } from "../models/inspection.model";
import ButtonRegistrarVistoria from "./NewInspectionButton";

export interface ModalDepartmentInspectionsProps {
    departamentoId: string;
    onClose: () => void;
}

export default function ModalDepartmentInspections({ departamentoId, onClose }: ModalDepartmentInspectionsProps) {
    const [vistorias, setVistorias] = useState<Vistoria[]>([]);

    useEffect(() => {
        const fetchVistoriasDepartamento = async () => {
            const vistorias = await vistoriasService.getVistoriasByDepartamentoId(departamentoId);
            setVistorias(vistorias);
        };
        fetchVistoriasDepartamento();
    }, [departamentoId]);

    return (
        <Dialog open onOpenChange={onClose}>
            
            <DialogContent className="max-w-2xl w-full p-4 px-8 rounded-lg">
                <DialogHeader>
                    <DialogTitle>Vistorias do Departamento: {vistorias[0]?.vistoria_dpto?.name}</DialogTitle>
                    <DialogDescription>
                        {vistorias.length === 0 ? (
                            <span className="text-yellow-600">Nenhuma vistoria encontrada para este departamento.</span>
                        ) : (
                            <>
                                Vistorias do Departamento:
                                <ul>
                                    {[...vistorias]
                                        .sort((a, b) => new Date(b.data_vistoria).getTime() - new Date(a.data_vistoria).getTime())
                                        .slice(0, 3)
                                        .map((v) => (
                                            <li key={v.id}>
                                                Responsável: {v.responsavel?.name} | Data: {new Date(v.data_vistoria).toLocaleDateString()}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </>
                        )}
                        <div className="mt-4">
                            <ButtonRegistrarVistoria departamentoId={departamentoId}/>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                
            </DialogContent>
        </Dialog>
    );
}