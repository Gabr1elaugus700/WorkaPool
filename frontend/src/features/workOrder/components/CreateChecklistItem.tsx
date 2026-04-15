import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemChecklistService } from '../services/checklistItem.service';
import { toast } from 'sonner';

type Props = {
    onItemCreated?: (itemName: string) => void;
    valorDigitando?: string;
};

const criarItemChecklistService = async (itemName: string) => {
    const response = await itemChecklistService.create(itemName);
    if (!response) {
        toast.error('Erro ao criar item de checklist');
    } else{
        toast.success('Item de checklist criado com sucesso');
    }
    return response;
};

const CreateChecklistItem: React.FC<Props> = ({ onItemCreated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [itemName, setItemName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!itemName.trim()) return;
        setLoading(true);
        try {
            await criarItemChecklistService(itemName.trim());
            onItemCreated?.(itemName.trim());
            setItemName('');
            setIsEditing(false);
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                aria-label="Adicionar item"
                className="flex items-center gap-1"
            >
                <PlusIcon size={16} /> Criar Novo Item
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                type="text"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="Nome do item"
                disabled={loading}
                autoFocus
                className="w-40"
            />
            <Button
                type="button"
                onClick={handleSave}
                disabled={loading || !itemName.trim()}
                size="sm"
            >
                Salvar
            </Button>
            <Button
                type="button"
                onClick={() => { setIsEditing(false); setItemName(''); }}
                disabled={loading}
                variant="ghost"
                size="sm"
            >
                Cancelar
            </Button>
        </div>
    );
};

export default CreateChecklistItem;