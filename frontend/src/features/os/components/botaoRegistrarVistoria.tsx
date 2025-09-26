import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, } from "react";
import { Button } from "@/components/ui/button";
import { departamentosService } from '@/features/departamentos/services/departamentosService';
import { Departamento } from '@/features/departamentos/models/departamentosModel';
import { DepartamentoUsuario } from '@/features/departamentos/models/departamentoUsuarioModel';
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { vistoriasService } from "../services/vistoriasService";
import ListChecklists from "./listarChecklists";
import CheckboxModeloVistoria from "./checklistSelecionado";
import { PlusCircle } from "lucide-react";


interface ButtonRegistrarVistoriaProps {
  departamentoId?: string;
  onVistoriaCriada?: () => void;
}

export default function ButtonRegistrarVistoria({ departamentoId, onVistoriaCriada }: ButtonRegistrarVistoriaProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca departamentos e usuários
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [users, setUsers] = useState<DepartamentoUsuario[]>([]);
  // Form state
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>(departamentoId || "");
  const [selectUserSetor, setSelectUserSetor] = useState<string>("");
  const [dataVistoria, setDataVistoria] = useState<string>("");

  // Checklist selecionado
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");

  const { user } = useAuth();
  // console.log(user)
  const departamentoUsuarioLogadoId = user?.departamentos?.[0]?.departamento?.id;
  // const departamentoUsuarioLogadoName = user?.departamentos?.[0]?.departamento?.name;  

  const [itensSelecionados, setItensChecklist] = useState<{ checklistItemId: string; checked: boolean; observacao: string }[]>([]);

  // Carregar departamentos se necessário
  useEffect(() => {
    if (!departamentoId && open) {
      departamentosService.getAll().then(setDepartamentos);
    }
  }, [departamentoId, open]);

  // Carregar Checlist Selecionado
  useEffect(() => {
    const fetchChecklist = async () => {
      const response = await vistoriasService.getChecklist();
      const data = response;
      return data;
    };
    fetchChecklist();
  }, [setSelectedChecklistId]);


  // Carregar usuários do departamento do usuário logado apenas uma vez
  useEffect(() => {
    const fetchUsersInDpto = async () => {
      if (departamentoUsuarioLogadoId) {
        const usersInDpto = await departamentosService.usersInDepartamento(departamentoUsuarioLogadoId);
        setUsers(usersInDpto);
        console.log(usersInDpto);
      } else {
        setUsers([]);
        console.log("Usuário não está associado a nenhum departamento.");
      }
    };
    fetchUsersInDpto();
  }, [departamentoUsuarioLogadoId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedDepartamento || !selectUserSetor || !dataVistoria) {
        setError("Preencha todos os campos obrigatórios.");
        setLoading(false);
        return;
      }


      const dataISO = new Date(dataVistoria + 'T00:00:00').toISOString();
      const response = await vistoriasService.createVistoria(
        departamentoId || selectedDepartamento,
        selectUserSetor,
        dataISO
      );

      // Espera o ID da vistoria criada
      const vistoriaId = response.id;
      console.log("Vistoria criada, id:", vistoriaId);

      // Verifica se o ID da vistoria foi retornado
      if (!vistoriaId) {
        setError("Erro ao criar vistoria: id não retornado.");
        setLoading(false);
        return;
      }

      // Valida se há itens selecionados
      console.log("Itens selecionados para o checklist:", itensSelecionados);
      // Criando o vinculo de Checklist com a Vistoria
      const vistoriaChecklist = await vistoriasService.createVistoriaWithChecklist(
        vistoriaId,
        selectedChecklistId,
        itensSelecionados
      );

      console.log("Checklist da Vistoria criado:", vistoriaChecklist);

      // Agora você pode usar o retorno em `response`
      toast.success("Vistoria criada com sucesso!");
      if (onVistoriaCriada) onVistoriaCriada();

      setOpen(false);
      setSelectUserSetor("");
      setDataVistoria("");
      if (!departamentoId) setSelectedDepartamento("");
    } catch (error) {
      setError("Erro ao criar vistoria." + (error instanceof Error ? error.message : ""));
      toast.error("Erro ao criar vistoria" + (error instanceof Error ? error.message : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:dark:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all"> 
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Vistoria 
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl w-full p-4 px-8 rounded-lg sm:rounded-lg sm:p-8"
        style={{
          maxHeight: '70dvh',
          width: '90vw',
          borderRadius: 10,
          padding: 0,
          overflow: 'auto',
        }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Criar nova Vistoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 px-4 py-2 sm:px-8" style={{ maxHeight: 'calc(100dvh - 80px)', overflowY: 'auto' }}>
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {/* Departamento (se não vier por prop) */}
            {!departamentoId && (
              <div className="flex-1 min-w-[180px]">
                <Label htmlFor="departamento">Departamento dessa Vistoria:</Label>
                <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento} required>
                  <SelectTrigger id="departamento">
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((d) => (
                      <SelectItem className="cursor-pointer" key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Funcionário */}
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="funcionario">Funcionário responsável:</Label>
              <Select value={selectUserSetor} onValueChange={setSelectUserSetor} disabled={users.length === 0}>
                <SelectTrigger id="funcionario">
                  <SelectValue placeholder={users.length ? "Selecione o funcionário" : "Nenhum colaborador disponível no seu setor"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((item) => (
                    <SelectItem className="cursor-pointer" key={item.usuario.id} value={item.usuario.id}>
                      {item.usuario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Data */}
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="data_vistoria">Data da Vistoria</Label>
              <div className="relative flex items-center">
                <input
                  id="data_vistoria"
                  type="date"
                  className="border rounded-md px-2 py-2 w-full mt-1 pr-10"
                  value={dataVistoria}
                  onChange={e => setDataVistoria(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {/* Lucide Calendar Icon */}
                  <svg  
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-calendar"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <Label htmlFor="checklistModelo">Checklist:
            <ListChecklists
              selectedChecklistId={selectedChecklistId}
              setSelectedChecklistId={setSelectedChecklistId}
            />
          </Label>
          {/* {selectedChecklistId !== "" && (<div>Checklist selecionado: {selectedChecklistId}</div>
          )} */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {selectedChecklistId && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Itens do Checklist</h4>
              <CheckboxModeloVistoria
                selectedChecklistId={selectedChecklistId}
                onChangeItens={setItensChecklist}
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Vistoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}