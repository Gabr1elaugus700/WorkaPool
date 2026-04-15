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
} from "@/components/ui/dialog"
import { useState } from "react";

export interface CreateChecklistItemsProps {
    descricao: string;
    onCreate: (descricao: string) => void;
}

export default function ModalCreateChecklistItems({ descricao, onCreate }: CreateChecklistItemsProps) {
  const [descricaoItem, setDescricaoItem] = useState("");
  const handleClick = () => {
    onCreate(descricaoItem);
  };

  return (
    <div>
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
            value={descricao}
            onChange={(e) => setDescricaoItem(e.target.value)}
            placeholder="Descrição do item"
            className="border p-2 rounded w-full"
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleClick}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}