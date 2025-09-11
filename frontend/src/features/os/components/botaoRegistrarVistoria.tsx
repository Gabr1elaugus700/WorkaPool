import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, } from "react";
import { Button } from "@/components/ui/button";
import { departamentosService } from '@/features/departamentos/services/departamentosService';
import { Departamento } from '@/features/departamentos/models/departamentosModel';
import { DepartamentoUsuario } from '@/features/departamentos/models/departamentoUsuarioModel';
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { vistoriasService } from "../services/vistoriasService";
import ListChecklists from "./listarChecklists";

interface ButtonRegistrarVistoriaProps {
  departamentoId?: string;
  descricao?: string;
}

export default function ButtonRegistrarVistoria({ departamentoId, descricao }: ButtonRegistrarVistoriaProps) {
  const [open, setOpen] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [users, setUsers] = useState<DepartamentoUsuario[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>(departamentoId || "");
  const [selectUserSetor, setSelectUserSetor] = useState<string>("");
  const [dataVistoria, setDataVistoria] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");

  const { user } = useAuth();
  // console.log(user)
  const departamentoUsuarioLogadoId = user?.departamentos?.[0]?.departamento?.id;
  const departamentoUsuarioLogadoName = user?.departamentos?.[0]?.departamento?.name;


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

      const response = await vistoriasService.createVistoria(
        departamentoId || selectedDepartamento,
        selectUserSetor,
        dataVistoria.toISOString()
      );

      const vistoriaId = response.data?.id;

      console.log("Vistoria criada, id:", vistoriaId);
      // Agora você pode usar o retorno em `response`
      toast.success("Vistoria criada com sucesso!");

      setOpen(false);
      setSelectUserSetor("");
      setDataVistoria(undefined);
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
        <Button>{descricao || "Registrar Vistoria"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full p-4 px-8 rounded-lg">
        <DialogHeader>
          <DialogTitle>Criar nova Vistoria</DialogTitle>
          Seu departamento: {departamentoUsuarioLogadoName}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Departamento (se não vier por prop) */}
          {!departamentoId && (
            <div>
              <Label htmlFor="departamento">Departamento dessa Vistoria:</Label>
              <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento} required>
                <SelectTrigger id="departamento">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Funcionário */}
          <div>
            <Label htmlFor="funcionario">Funcionário responsável:</Label>
            <Select value={selectUserSetor} onValueChange={setSelectUserSetor} disabled={users.length === 0}>
              <SelectTrigger id="funcionario">
                <SelectValue placeholder={users.length ? "Selecione o funcionário" : "Nenhum colaborador disponível no seu setor"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((item) => (
                  <SelectItem key={item.usuario.id} value={item.usuario.id}>
                    {item.usuario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Data da Vistoria */}
          <div>
            <Label htmlFor="data_vistoria">Data da Vistoria</Label>
            <Calendar
              mode="single"
              selected={dataVistoria}
              onSelect={setDataVistoria}
              className="border rounded-md"
              locale={ptBR}
            />
            {dataVistoria && (
              <div className="text-xs text-gray-500 mt-1">Selecionado: {format(dataVistoria, 'dd/MM/yyyy')}</div>
            )}
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