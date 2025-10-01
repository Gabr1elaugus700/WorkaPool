import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MapPinCheck } from "lucide-react";

type Status = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA";

interface ModalCriarOrdemServicoProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export default function ModalCriarOrdemServico({
  open,
  setOpen
}: ModalCriarOrdemServicoProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;

  // Form state
  const [problema, setProblema] = useState("");
  const [descricao, setDescricaoItem] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [localizacao, setLocalizacao] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("BAIXA");
  const [dataVencimento, setDataVencimento] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // lógica aqui
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 max-w-md w-full h-[100dvh] sm:rounded-lg flex flex-col  dark:bg-background-dark"
      >
        {/* Header fixo */}
        <DialogHeader className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-content-light  dark:text-content-dark"
            >
              ✕
            </button>
            <DialogTitle className="text-lg font-bold flex-1 text-center -ml-6">
              Nova Ordem de Serviço
            </DialogTitle>
            <div className="w-6" />
          </div>
        </DialogHeader>

        {/* Formulário rolável */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="problema">Título da Ordem</Label>
            <Input
              id="problema"
              placeholder="Ex: Conserto de vazamento"
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-none focus:ring-2 focus:ring-primary px-4"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição Detalhada do Problema</Label>
            <textarea
              id="descricao"
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              value={descricao}
              onChange={e => setDescricaoItem(e.target.value)}
              className="w-full h-36 resize-none rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-none focus:ring-2 focus:ring-primary p-4 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="localizacao">Localização</Label>
            <div className="relative">
              <Input
                id="localizacao"
                placeholder="Ex: Banheiro do 2º andar"
                value={localizacao}
                onChange={e => setLocalizacao(e.target.value)}
                className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-none focus:ring-2 focus:ring-primary px-4 pr-10"
              />
              <MapPinCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder-light dark:text-placeholder-dark" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prioridade">Prioridade</Label>
              <select
                id="prioridade"
                value={prioridade}
                onChange={e => setPrioridade(e.target.value as Prioridade)}
                className="form-select h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark border-none focus:ring-2 focus:ring-primary px-4 appearance-none"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={dataVencimento}
                onChange={e => setDataVencimento(e.target.value)}
                className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark border-none focus:ring-2 focus:ring-primary px-4"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="responsavel">Responsável</Label>
            <select
              id="responsavel"
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              className="form-select h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark border-none focus:ring-2 focus:ring-primary px-4 appearance-none"
            >
              <option value="">Selecionar usuário</option>
              <option value="1">João da Silva</option>
              <option value="2">Maria Oliveira</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="foto"
              className="mt-2 inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/30 text-primary font-bold text-sm"
            >
              <Camera />
              Anexar Foto
            </label>
            <input id="foto" type="file" className="hidden" />
          </div>
        </form>

        {/* Footer fixo */}
        <footer className="p-4 border-t bg-background-light dark:bg-background-dark">
          <Button
            type="submit"
            form="form" 
            disabled={loading}
            className="w-full h-12 rounded-lg bg-primary text-background-dark font-bold hover:bg-primary/90"
          >
            {loading ? "Salvando..." : "Criar Ordem de Serviço"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
