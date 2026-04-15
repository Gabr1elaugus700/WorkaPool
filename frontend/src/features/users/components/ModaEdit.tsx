import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { User } from "../models/usersModel"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usersService } from "../services/usersService";
import { departamentosService } from "../../departamentos/services/departamentosService";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react";
import { toast } from "sonner"
import { Departamento } from "@/features/departamentos/models/departamentosModel";


export default function EditUserModal({ isOpen, onClose, user, fetchUsers }: { isOpen: boolean; onClose: () => void; user: User | null; fetchUsers: () => void; }) {
    const [selectedRole, setSelectedRole] = useState(user?.role || "");
    const [funcao, setFuncao] = useState(user?.funcao || ""); 
    const [name, setName] = useState(user?.name || "");
    const [login, setLogin] = useState(user?.user || "");
    const [departamentos, setDepartamentos] = useState<string>(
        typeof user?.departamentos === "string"
            ? user.departamentos
            : Array.isArray(user?.departamentos)
                ? (typeof user.departamentos[0] === "string"
                    ? user.departamentos[0]
                    : user.departamentos[0]?.departamento?.id?.toString() || "")
                : ""
    );
    const [listDepartamentos, setListDepartamentos] = useState<Departamento[]>([]);

    useEffect(() => {

        const fetchDepartamentos = async () => {
            try {
                const response = await departamentosService.getAll();
                setListDepartamentos(response);
            } catch (error) {
                console.error("Error fetching departamentos:", error);
            }
        };

        fetchDepartamentos();
    }, []);


    useEffect(() => {
        if (user) {
            setSelectedRole(user.role || "");
            setName(user.name || "");
            setLogin(user.user || "");
            setDepartamentos(
                typeof user.departamentos === "string"
                    ? user.departamentos
                    : Array.isArray(user.departamentos)
                        ? (typeof user.departamentos[0] === "string"
                            ? user.departamentos[0]
                            : user.departamentos[0]?.departamento?.id?.toString() || "")
                        : ""
            );
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const updatedUser = {
                name,
                user: login,
                role: selectedRole
            };

            await usersService.updateUser(user.id, updatedUser);
            await usersService.addToDepartment(user.id, departamentos, funcao);
            
            toast.success('Usuário atualizado com sucesso!');
            fetchUsers();
            onClose();

        } catch (error) {
            toast.error('Erro ao atualizar usuário');
            console.error('Erro ao atualizar usuário:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os campos abaixo para editar o usuário.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <div className="">
                        <label htmlFor="name">Nome:</label>
                        <Input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="login">Login:</label>
                        <Input
                            type="text"
                            id="login"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)} />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="departamentos">Departamento:</label>
                        <Select
                            value={departamentos}
                            onValueChange={setDepartamentos}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um departamento" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-200">
                                {listDepartamentos.map((departamento) => (
                                    <SelectItem key={departamento.id} value={departamento.id?.toString() ?? ""}>
                                        {departamento.name.toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* <Input
                            type="text"
                            id="departamentos"
                            value={departamentos}
                            onChange={(e) => setDepartamentos(e.target.value)} /> */}
                    </div>
                    <div className="mt-4">
                        <label htmlFor="role">Nivel de Acesso:</label>
                        <Select
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-200">
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="GERENTE_DPTO">GERENTE DEPARTAMENTO</SelectItem>
                                <SelectItem value="USER">USUÁRIO</SelectItem>
                                <SelectItem value="ALMOX">ALMOXARIFADO</SelectItem>
                            </SelectContent>
                        </Select>
                        
                    </div>
                    <div className="mt-4">
                        <label htmlFor="role">Função:</label>
                        <Select
                            value={funcao}
                            onValueChange={setFuncao}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-200">
                                <SelectItem value="GERENTE">GERENTE</SelectItem>
                                <SelectItem value="FUNCIONARIO">FUNCIONÁRIO</SelectItem>
                            </SelectContent>
                        </Select>
                        <DialogFooter className="mt-4">
                            <Button type="button" onClick={onClose} variant={"outline"}>
                                Cancelar
                            </Button>
                            <Button type="submit" onClick={handleSubmit}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </div>

                </div>
            </DialogContent>

        </Dialog>
    );
}
