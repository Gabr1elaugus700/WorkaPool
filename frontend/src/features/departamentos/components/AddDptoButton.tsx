import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { departamentosService } from "../services/departamentosService";
import { toast } from "sonner";

export default function AddDptoButton() {
    const [name, setName] = useState("");
    const [recebe_os, setRecebeOs] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await departamentosService.create({ 
                name,
                recebe_os
            });
            toast.success("Departamento criado com sucesso!");
            setName("");
            setRecebeOs(false);
        } catch (error) {
            toast.error("Erro ao criar departamento");
            console.error("Error creating department:", error);
        }
    };

    return (
        <>
            <Dialog >
                <DialogTrigger asChild>
                    <Button variant="outline">Criar Departamentos</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Departamento</DialogTitle>
                        <DialogDescription>
                            Preencha os campos abaixo para adicionar um novo departamento.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <div className="">
                            <label htmlFor="name">Nome Departamento:</label>
                            <Input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="recebe_os"
                                    checked={recebe_os}
                                    onCheckedChange={(checked) => setRecebeOs(!!checked)}
                                />
                                <span>Este departamento pode receber Ordem De Serviços</span>
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="submit" onClick={handleSubmit}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>

            </Dialog>
        </>
    );
}
