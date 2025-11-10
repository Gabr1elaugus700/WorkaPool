import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { vistoriasService } from "../services/vistoriasService";
import { ChecklistModelo } from "../models/checklistModel";

type ListChecklistProps = {
    selectedChecklistId: string;
    setSelectedChecklistId: (id: string) => void;
};

export default function ListChecklists({ selectedChecklistId, setSelectedChecklistId }: ListChecklistProps) {
    const [checklists, setChecklists] = useState<ChecklistModelo[]>([]);

    // Carrega os checklists ao montar o componente
    useEffect(() => {
        const fetchChecklists = async () => {
            const response = await vistoriasService.getChecklist();
            const data = response; 
            setChecklists(data);
        };
        fetchChecklists();
    }, []);

    return (
        <div>
            <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione um checklist" />
                </SelectTrigger>
                <SelectContent>
                    {checklists.map((checklist) => (
                        <SelectItem key={checklist.id} value={checklist.id } className="cursor-pointer">
                            {checklist.nome}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
