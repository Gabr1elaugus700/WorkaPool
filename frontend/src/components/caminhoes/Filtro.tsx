import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type SolicitacaoFrete = {
    id?: number | string;
    origem: string;
    destino: string;
};

interface SearchSelectProps {
    data: SolicitacaoFrete[];
    onSelect: (item: SolicitacaoFrete) => void;
    onCreateFrete?: (termo: string) => void;
    placeholder?: string;
}

export function SearchSelect({ data, onSelect, onCreateFrete, placeholder }: SearchSelectProps) {
    const [search, setSearch] = useState("");
    const [openDialog, setOpenDialog] = useState(false);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return data.filter(
            (item) =>
                item.origem.toLowerCase().includes(term) ||
                item.destino.toLowerCase().includes(term)
        );
    }, [search, data]);

    // Sempre que trocar a busca, fecha o dialog
    useEffect(() => {
        setOpenDialog(false);
    }, [search]);

    return (
        <div className="w-full max-w-md space-y-2">
            {/* Campo de busca + botão cadastrar */}
            <div className="flex gap-2 items-center">
                <Input
                    placeholder={placeholder || "Buscar por origem ou destino..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {search.trim() !== "" && filtered.length === 0 && (
                    <Button
                        onClick={() => setOpenDialog(true)}
                        className="px-4 py-2 bg-primary text-white rounded-md"
                    >
                        Solicitar Frete
                    </Button>
                )}
            </div>

            {/* Lista de resultados */}
            {search.trim() !== "" && filtered.length > 0 && (
                <ScrollArea className="h-48 border rounded-md mt-2">
                    <div className="p-2 space-y-1">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="cursor-pointer rounded-md px-2 py-1 hover:bg-accent"
                            >
                                {item.origem} → {item.destino}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}

            {/* Dialog para criação de frete */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Frete não encontrado</DialogTitle>
                        <DialogDescription>
                            Não encontramos nenhuma rota para <strong>{search}</strong>.
                            Deseja criar um novo frete?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                setOpenDialog(false);
                                onCreateFrete?.(search);
                            }}
                        >
                            Criar frete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
