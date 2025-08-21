import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { Carga } from "@/types/cargas";

interface FiltroCargatProps {
  cargas: Carga[];
  onFiltroChange: (destinosSelecionados: string[]) => void;
}

export function FiltroCarga({ cargas, onFiltroChange }: FiltroCargatProps) {
  const [destinosSelecionados, setDestinosSelecionados] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    console.log('🔧 FiltroCarga - Cargas recebidas:', cargas?.length || 0);
    console.log('🔧 FiltroCarga - Primeira carga:', cargas?.[0]);
  }, [cargas]);

  // Extrai todos os destinos únicos das cargas abertas
  const destinosUnicos = useMemo(() => {
    console.log('🔧 Calculando destinos únicos...');

    if (!cargas || cargas.length === 0) {
      console.log('❌ Nenhuma carga disponível');
      return [];
    }

    const cargasAbertas = cargas.filter(carga =>
      carga.situacao === "ABERTA" || carga.situacao === "SOLICITADA"
    );

    console.log('🔧 Cargas abertas/solicitadas:', cargasAbertas.length);

    const destinos = cargasAbertas
      .map(carga => carga.destino)
      .filter(destino => destino && destino.trim() !== '') // Filtrar destinos vazios
      .filter((destino, index, array) => array.indexOf(destino) === index)
      .sort();

    console.log('🔧 Destinos únicos encontrados:', destinos);
    return destinos;
  }, [cargas]);

  // DEBUG: Log mudanças de destinos selecionados
  useEffect(() => {
    console.log('🔧 Destinos selecionados:', destinosSelecionados);
  }, [destinosSelecionados]);

  const handleDestinoChange = (destino: string, checked: boolean) => {
    console.log('🔧 Mudança de destino:', destino, checked);

    let novosDestinos: string[];

    if (checked) {
      novosDestinos = [...destinosSelecionados, destino];
    } else {
      novosDestinos = destinosSelecionados.filter(d => d !== destino);
    }

    console.log('🔧 Novos destinos:', novosDestinos);
    setDestinosSelecionados(novosDestinos);
    onFiltroChange(novosDestinos);
  };


  const handleSelecionarTodos = () => {
    if (destinosSelecionados.length === destinosUnicos.length) {
      // Se todos estão selecionados, desmarca todos
      setDestinosSelecionados([]);
      onFiltroChange([]);
    } else {
      // Seleciona todos
      setDestinosSelecionados(destinosUnicos);
      onFiltroChange(destinosUnicos);
    }
  };

  const handleLimparFiltros = () => {
    setDestinosSelecionados([]);
    onFiltroChange([]);
  };

  if (destinosUnicos.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={destinosSelecionados.length > 0 ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrar Cargas
          {destinosSelecionados.length > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {destinosSelecionados.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtrar por Destino</h4>
            {destinosSelecionados.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimparFiltros}
                className="h-auto p-1 text-xs"
              >
                Limpar
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="todos"
              checked={destinosSelecionados.length === destinosUnicos.length && destinosUnicos.length > 0}
              onCheckedChange={handleSelecionarTodos}
            />
            <label
              htmlFor="todos"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Selecionar todos
            </label>
          </div>

          <ScrollArea className="h-48">
            <div className="space-y-2">
              {destinosUnicos.map((destino) => (
                <div key={destino} className="flex items-center space-x-2">
                  <Checkbox
                    id={destino}
                    checked={destinosSelecionados.includes(destino)}
                    onCheckedChange={(checked) => handleDestinoChange(destino, checked as boolean)}
                  />
                  <label
                    htmlFor={destino}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {destino}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>

          {destinosSelecionados.length > 0 && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {destinosSelecionados.length} de {destinosUnicos.length} selecionados
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}