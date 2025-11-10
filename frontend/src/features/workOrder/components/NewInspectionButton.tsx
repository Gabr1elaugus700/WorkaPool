import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { departamentosService } from "@/features/departamentos/services/departamentosService";
import { Departamento } from "@/features/departamentos/models/departamentosModel";
import { DepartamentoUsuario } from "@/features/departamentos/models/departamentoUsuarioModel";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { vistoriasService } from "../services/vistoriasService";
import ListChecklists from "./ListChecklists";
import CheckboxModeloVistoria from "./SelectedChecklist";
import { PlusCircle } from "lucide-react";
import ModalCriarOrdemServico from "./ModalCreateWorkOrder";
import ModalConfirmCreateOs from "./ModalConfirmWorkOrderCreation";

interface NewInspectionButtonProps {
  departamentoId?: string;
  onVistoriaCriada?: () => void;
}

export default function NewInspectionButton({
  departamentoId,
  onVistoriaCriada,
}: NewInspectionButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca departamentos e usuários
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [users, setUsers] = useState<DepartamentoUsuario[]>([]);
  // Form state
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>(
    departamentoId || ""
  );
  const [selectUserSetor, setSelectUserSetor] = useState<string>("");
  const [dataVistoria, setDataVistoria] = useState<string>("");

  // Checklist selecionado
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");

  const { user } = useAuth();
  // console.log(user)
  const departamentoUsuarioLogadoId =
    user?.departamentos?.[0]?.departamento?.id;
  // const departamentoUsuarioLogadoName = user?.departamentos?.[0]?.departamento?.name;

  const [itensSelecionados, setItensChecklist] = useState<
    { checklistItemId: string; checked: boolean; observacao: string }[]
  >([]);

  // Verifica se há itens não marcados
  //   const hasUncheckedItems = itensSelecionados.some(i => !i.checked);
  const unchecked = itensSelecionados.filter((i) => !i.checked);
  // Modal de confirmação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [osModalOpen, setOsModalOpen] = useState(false);

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
        const usersInDpto = await departamentosService.usersInDepartamento(
          departamentoUsuarioLogadoId
        );
        setUsers(usersInDpto);
        console.log(usersInDpto);
      } else {
        setUsers([]);
        console.log("Usuário não está associado a nenhum departamento.");
      }
    };
    fetchUsersInDpto();
  }, [departamentoUsuarioLogadoId, open]);

  const createSurveyFlow = async (abrirOs: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const dataISO = new Date(dataVistoria + "T00:00:00").toISOString();
      const response = await vistoriasService.createVistoria(
        departamentoId || selectedDepartamento,
        selectUserSetor,
        dataISO
      );
      // Espera o ID da vistoria criada
      const vistoriaId = response.id;
      if (!vistoriaId) {
        setError("Erro ao criar vistoria: id não retornado.");
        setLoading(false);
        return;
      }

      await vistoriasService.createVistoriaWithChecklist(
        vistoriaId,
        selectedChecklistId,
        itensSelecionados
      );
      toast.success("Vistoria criada com sucesso!");

      if (abrirOs) {
        // Abrir modal de criação de OS
        setOsModalOpen(true);
      } else {
        setOpen(false);
      }

      // Reset
      setSelectUserSetor("");
      setDataVistoria("");
      if (!departamentoId) setSelectedDepartamento("");
      if (onVistoriaCriada) onVistoriaCriada();
    } catch (error) {
      setError(
        "Erro ao criar vistoria." +
          (error instanceof Error ? error.message : "")
      );
      toast.error(
        "Erro ao criar vistoria" + (error instanceof Error ? error.message : "")
      );
    } finally {
      setLoading(false);
      setPendingSubmit(false);
    }
  };

  // Função de submissão do formulário Caso Tenha Itens Não Marcados com Abertura de OS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      (!selectedDepartamento && !departamentoId) ||
      !selectUserSetor ||
      !dataVistoria
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    // Se há itens não checados, pede confirmação e interrompe fluxo
    if (unchecked.length > 0) {
      setConfirmOpen(true);
      setPendingSubmit(true);
      return;
    }

    // Sem itens não checados -> segue direto
    createSurveyFlow(false);
  };

  return (
    <>
      <ModalConfirmCreateOs
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          if (!pendingSubmit) return;
        }}
        onSkip={() => {
          if (pendingSubmit) createSurveyFlow(false);
        }}
        onConfirm={() => {
          if (pendingSubmit) createSurveyFlow(true);
        }}
      />
      {osModalOpen && (
        <ModalCriarOrdemServico
          open={osModalOpen}
          setOpen={setOsModalOpen}
          onOsCreated={() => setOsModalOpen(false)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:dark:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Vistoria
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-2xl w-full p-4 px-8 rounded-lg sm:rounded-lg sm:p-6 h-auto flex flex-col max-h-[90vh]"
          style={{
            width: "90vw",
            borderRadius: 10,
            padding: 0,
          }}
        >
          <DialogHeader className="p-4 border-b flex items-center gap-2">
            <DialogTitle className="text-2xl font-bold">
              Detalhes do Checklist
            </DialogTitle>
          </DialogHeader>
          <main className="overflow-y-auto px-4 py-4 space-y-4 flex-1">
            <form
              onSubmit={handleSubmit}
              className="max-w-md mx-auto space-y-4 "
            >
              <div className="flex flex-col gap-4 md:flex-col md:gap-6 ">
                {/* Departamento (se não vier por prop) */}
                {!departamentoId && (
                  <div className="flex-1 min-w-[180px]">
                    <Label htmlFor="departamento">
                      Departamento dessa Vistoria:
                    </Label>
                    <Select
                      value={selectedDepartamento}
                      onValueChange={setSelectedDepartamento}
                      required
                    >
                      <SelectTrigger id="departamento">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((d) => (
                          <SelectItem
                            className="cursor-pointer"
                            key={d.id}
                            value={String(d.id)}
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Funcionário */}
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="funcionario">Funcionário responsável:</Label>
                  <Select
                    value={selectUserSetor}
                    onValueChange={setSelectUserSetor}
                    disabled={users.length === 0}
                  >
                    <SelectTrigger id="funcionario">
                      <SelectValue
                        placeholder={
                          users.length
                            ? "Selecione o funcionário"
                            : "Nenhum colaborador disponível no seu setor"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((item) => (
                        <SelectItem
                          className="cursor-pointer"
                          key={item.usuario.id}
                          value={item.usuario.id}
                        >
                          {item.usuario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Data */}
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="data_vistoria">Data da Vistoria:</Label>
                  <div className="relative flex items-center">
                    <input
                      id="data_vistoria"
                      type="date"
                      className={
                        `mt-1 w-full rounded-lg border-gray-300 bg-gray-100 p-2 text-gray-700 ` +
                        (!dataVistoria ? "text-gray-400" : "")
                      }
                      value={dataVistoria}
                      onChange={(e) => setDataVistoria(e.target.value)}
                      required
                      onFocus={(e) =>
                        e.target.classList.remove("text-gray-400")
                      }
                      onBlur={(e) =>
                        !e.target.value &&
                        e.target.classList.add("text-gray-400")
                      }
                    />
                  </div>
                </div>

                <Label htmlFor="checklistModelo">Checklist: </Label>
                <ListChecklists
                  selectedChecklistId={selectedChecklistId}
                  setSelectedChecklistId={setSelectedChecklistId}
                />
              </div>
              {/* {selectedChecklistId !== "" && (<div>Checklist selecionado: {selectedChecklistId}</div>
          )} */}
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {selectedChecklistId && (
                <CheckboxModeloVistoria
                  selectedChecklistId={selectedChecklistId}
                  onChangeItens={setItensChecklist}
                />
              )}
              <div className="flex">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold sticky bottom-0 "
                >
                  {loading ? "Salvando..." : "Salvar Vistoria"}
                </Button>
              </div>
            </form>
          </main>
        </DialogContent>
      </Dialog>
    </>
  );
}
