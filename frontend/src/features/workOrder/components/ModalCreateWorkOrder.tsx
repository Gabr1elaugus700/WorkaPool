import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MapPinCheck } from "lucide-react";
import { osService } from "../services/workOrder.service";
import { toast } from "sonner";
import FormField from "@/components/ui/FormField";

type Status = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA";

interface ModalCreateWorkOrderProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onOsCreated?: () => void;
}

export default function ModalCreateWorkOrder({
  open,
  setOpen,
  onOsCreated
}: ModalCreateWorkOrderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;

  // Form state
  const [problema, setProblema] = useState("");
  const [descricao, setDescricaoItem] = useState("");
  const [status, setStatus] = useState<Status>("ABERTA");
  const [localizacao, setLocalizacao] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("BAIXA");
  const [dataVencimento, setDataVencimento] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log({
      problema,
      descricao,
      localizacao,
      status,
      prioridade,
      imagens: fotos,
      email_solicitante: emailSolicitante
    });

    try {
      if (!problema || !descricao || !emailSolicitante) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        setLoading(false);
        return;
      }
      const response = await osService.create({
        data_criacao: new Date().toISOString(), 
        problema,
        descricao,
        localizacao,
        status,
        prioridade,
        email_solicitante: emailSolicitante,
        imagens: fotos,
      });
      console.log("Ordem de Serviço criada:", response);
      if (response) {
        toast.success("Ordem de Serviço criada com sucesso!");
        // Reset form
        setProblema("");
        setDescricaoItem("");
        setLocalizacao("");
        setStatus("ABERTA");
        setPrioridade("BAIXA");
        setDataVencimento("");
        setEmailSolicitante("");
        setFotos([]);
        handleOpenChange(false); // Close modal

        
      }
      if (onOsCreated) onOsCreated();

    } catch (error) {
      setError("Erro ao criar Ordem De serviço");
      toast.error("Erro ao criar Ordem De serviço" + error);
    } finally {
      setLoading(false);
    }

  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl w-full p-4 px-8 rounded-lg sm:rounded-lg"
        style={{
          maxHeight: '90dvh',
          width: '90vw',
          borderRadius: 10,
          padding: 0,
          overflow: 'auto',
        }}
      >
        {/* Header fixo */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Criar Ordem de Serviço</DialogTitle>
        </DialogHeader>

        {/* Formulário rolável */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-4 py-2 sm:px-8" style={{ maxHeight: 'calc(100dvh - 80px)', overflowY: 'auto' }}
        >

          <FormField
            id="problema"
            label="Título da Ordem"
            value={problema}
            onChange={setProblema}
            placeholder="Ex: Conserto de vazamento"
          />
          {/* <div className="space-y-1">
            <Label className="font-display" htmlFor="problema">Título da Ordem</Label>
            <Input
              id="problema"
              value={problema}
              onChange={e => setProblema(e.target.value)}
              placeholder="Ex: Conserto de vazamento"
              className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-none focus:ring-2 focus:ring-primary px-4"
            />
          </div> */}
          <FormField
            id="descricao"
            label="Descrição Detalhada do Problema"
            value={descricao}
            onChange={setDescricaoItem}
            placeholder="Descreva o problema com o máximo de detalhes possível..."
            type="textarea"
          />
          {/* <div className="space-y-1">
            <Label className="font-display" htmlFor="descricao">Descrição Detalhada do Problema</Label>
            <textarea
              id="descricao"
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              value={descricao}
              onChange={e => setDescricaoItem(e.target.value)}
              className="w-full h-36 resize-none rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-none focus:ring-2 focus:ring-green-500 p-4 text-sm"
            />
          </div> */}

          <div className="space-y-1">
            <Label className="font-display" htmlFor="localizacao">Localização</Label>
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
            <div className="space-y-1 flex-col flex">
              <Label className="font-display" htmlFor="prioridade">Prioridade</Label>
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

            <div className="space-y-1 flex-col flex">
              <Label className="font-display" htmlFor="data_vencimento">Data de Vencimento</Label>
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
            <Label className="font-display" htmlFor="emailSolicitante">Solicitante:</Label>
            <Input
              id="emailSolicitante"
              value={emailSolicitante}
              placeholder="Ex: joao.silva@email.com"
              onChange={e => setEmailSolicitante(e.target.value)}
              className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark border-none focus:ring-2 focus:ring-primary px-4"
            />
          </div>
          {/* Só aparecer para quem é do departamento de manutenção */}
          <div className="space-y-1 flex-col flex">
            <Label className="font-display" htmlFor="status">Status da Ordem de Serviço:</Label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as Status)}
              className="form-select h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark border-none focus:ring-2 focus:ring-primary px-4 appearance-none"
            >
              <option value="">Selecionar status</option>
              <option value="ABERTA">Aberta</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
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
            <input
              id="foto"
              type="file"
              className="hidden"
              multiple
              onChange={e => {
                // Permite selecionar várias imagens, inclusive em múltiplas seleções
                setFotos(prev => {
                  const files = Array.from(e.target.files || []);
                  // Junta os arquivos já selecionados com os novos, sem duplicar
                  const allFiles = [...prev, ...files].filter((file, idx, arr) =>
                    arr.findIndex(f => f.name === file.name && f.lastModified === file.lastModified) === idx
                  );
                  return allFiles;
                });
              }}
            />
            {fotos.length > 0 && (
              <div className="mt-2 text-sm text-primary font-bold">
                {fotos.length} foto(s) selecionada(s)
              </div>
            )}
          </div>
            {error && (
              toast.error(error)
            )}

          <div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-background-dark font-bold hover:bg-primary/90"
            >
              {loading ? "Salvando..." : "Criar Ordem de Serviço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
