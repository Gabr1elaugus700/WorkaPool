import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { itemChecklistService } from "../services/ItemChecklistService";
import { ItemChecklist } from "../models/itemChecklistModel";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { checklistModeloService } from "../services/checklistModeloService";

interface ButtonCriarChecklistProps {
  descricao?: string;
}

export default function ButtonCriarChecklist({ descricao }: ButtonCriarChecklistProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [selectedItens, setSelectedItens] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [nomeModelo, setNomeModelo] = useState("");

  useEffect(() => {
    const fetchItens = async () => {
      const response = await itemChecklistService.getAll();
      setItens(response);
    };
    fetchItens();
  }, []);

  const handleCheckboxChange = (itemId: string) => {
    setSelectedItens((prevSelected) =>
      prevSelected.includes(itemId)
        ? prevSelected.filter((id) => id !== itemId)
        : [...prevSelected, itemId]
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!selectedItens || !nomeModelo) {
        setError("Por favor, preencha todos os campos.");
        setLoading(false);
        toast.error("Por favor, preencha todos os campos.");
        return;
      }

      if (!nomeModelo.trim()) {
        setError("Digite o nome do checklist");
        setLoading(false);
        toast.error("Digite o nome do checklist");
        return;
      }

      const response = await checklistModeloService.create(
        nomeModelo,
        selectedItens.map(id => ({ id })),
      );

      if (response) {
        toast.success("Checklist criado com sucesso!");
        setOpen(false);
        setNomeModelo("");
        setSelectedItens([]);
      }
    } catch (error) {
      setError("Erro ao criar checklist");
      toast.error("Erro ao criar checklist" + error);
    } finally {
      setLoading(false);
    }
  };
  // Armazena também a descrição dos itens selecionados
  const selectedItensWithDescricao = itens
    .filter(item => selectedItens.includes(item.id))
    .map(item => ({ id: item.id, descricao: item.descricao }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">{descricao || "Criar Checklist"}</Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl w-full p-4 px-8 rounded-lg sm:rounded-lg"
        style={{
          maxHeight: '70dvh',
          width: '90vw',
          borderRadius: 10,
          padding: 0,
          overflow: 'auto',
        }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Criar Checklist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-2 sm:px-8" style={{ maxHeight: 'calc(100dvh - 80px)', overflowY: 'auto' }}>
          <div className="space-y-2">
            <Label htmlFor="setNomeModelo" className="block font-medium text-gray-700 border-n">
              Nome
            </Label>
            <Input id="setNomeModelo" placeholder="Digite o nome do checklist" value={nomeModelo} onChange={e => setNomeModelo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="block font-medium text-gray-700">
              Itens do Checklist:
            </Label>
            <div>
              <Input
                placeholder="Filtrar itens..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full mb-2"
              />
              <div className="max-h-60 overflow-auto border rounded p-2 mb-2">
                {(() => {
                  const filtered = itens.filter(item => item.descricao.toLowerCase().includes(search.toLowerCase()));
                  // Se não está pesquisando, mostra só os 3 primeiros não selecionados
                  const showAll = search.trim().length > 0;
                  const notSelected = filtered.filter(item => !selectedItens.includes(item.id));
                  const toShow = showAll ? notSelected : notSelected.slice(0, 3);
                  return toShow.length > 0 ? (
                    toShow.map((item) => (
                      <div key={item.id} className="flex items-center px-2 py-1">
                        <Checkbox
                          checked={selectedItens.includes(item.id)}
                          onCheckedChange={() => handleCheckboxChange(item.id)}
                          id={`item-${item.id}`}
                        />
                        <label htmlFor={`item-${item.id}`} className="ml-2 cursor-pointer">
                          {item.descricao}
                        </label>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Nenhum item encontrado</span>
                  );
                })()}
              </div>
              {/* Itens selecionados, agora abaixo da lista de opções */}
              {selectedItensWithDescricao.length > 0 && (
                <div className="mb-2">
                  <Label>Selecionados:</Label>
                  <ul className="flex flex-wrap gap-2 mt-1">
                    {selectedItensWithDescricao.map(item => (
                      <li key={item.id} className="flex items-center bg-gray-100 rounded px-2 py-1">
                        <Checkbox checked className="mr-1" />
                        <span className="mr-2">{item.descricao}</span>
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleCheckboxChange(item.id)} className="text-red-500 p-0 h-5 w-5">
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
          {error && (
            toast.error(error)
          )}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Checklist"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}