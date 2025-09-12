import { useState, useEffect } from "react";
import { vistoriasService } from "../services/vistoriasService";
import { ChecklistModelo } from "../models/checklistModel";
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"


type Props = {
    selectedChecklistId: string;
    // setSelectedChecklistId: (id: string) => void;
};

export default function CheckboxModeloVistoria({ selectedChecklistId }: Props) {
    const [checklist, setChecklist] = useState<ChecklistModelo[]>([]);

    useEffect(() => {
        const fetchChecklists = async () => {
            const response = await vistoriasService.getChecklistByModeloId(selectedChecklistId);
            const data = response; // Ajuste conforme a estrutura real do retorno
            setChecklist([
                {
                    id: data.id,
                    nome: data.nome,
                    descricao: data.descricao,
                    itens: data.itens,
                    departamento_id: data.departamento_id,
                    departamento: data.departamento,
                }
            ]);
        };
        fetchChecklists();
    }, [selectedChecklistId]);

    return (
        <div>
            <div className="flex flex-col gap-6">
                {checklist.length === 0 && (<p className="text-sm text-gray-500">Nenhum checklist selecionado.</p>)}
                {checklist.map((checklist) => (
                    <div key={checklist.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold">{checklist.nome}</h3>
                        <p className="text-sm text-gray-500">{checklist.descricao}</p>
                        <div className="flex flex-col gap-2 mt-2">
                            {checklist.itens.map((item) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <Checkbox id={`item-${item.id}`} />
                                    <Label htmlFor={`item-${item.id}`}>{item.checklistItem.descricao}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
