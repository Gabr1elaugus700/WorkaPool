import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { itemChecklistService } from "../services/ItemChecklistService";
import { toast } from "sonner";


export default function CriarItensChecklist() {
    const [descricaoItem, setDescricaoItem] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await itemChecklistService.create({ descricao: descricaoItem });
            toast.success("Item de checklist criado com sucesso!");
            setDescricaoItem("");
        } catch (error) {
            toast.error("Erro ao criar item de checklist.");
            console.error("Error creating item de checklist:", error);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="h-4 w-4 text-black-500" /> Criar Itens de Checklist
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Itens de Checklist</DialogTitle>
                    <DialogDescription>
                        Adicione uma nova descrição para o item de checklist.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type="text"
                    value={descricaoItem}
                    onChange={(e) => setDescricaoItem(e.target.value)}
                    placeholder="Descrição do item"
                    className="border p-2 rounded w-full"
                />
                <DialogFooter>
                    <Button variant="outline" onClick={handleSubmit}>
                        Criar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}