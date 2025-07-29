// components/fretes/SolicitarFreteModal.tsx
import { useState } from "react";
import { solicitacaoRota } from "@/services/fretesService";
import { Button } from "../ui/button";

import { toast } from "sonner"


export default function SolicitarFreteModal({ open, onClose, rotaInicial, solicitante, onSucesso }: {
    open: boolean;
    onClose: () => void;
    rotaInicial?: string;
    solicitante: string; // usuário logado
    onSucesso: () => void;
}) {
    const [form, setForm] = useState({
        origem: rotaInicial || "",
        destino: "",
        peso: 0,
        status: "PENDENTE",
    });


    const [loading, setLoading] = useState(false);

    const handleChange = (campo: keyof typeof form, valor: string | number) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const handleSubmit = async () => {
        if (!form.origem || !form.destino || !form.peso) {
            toast.error("Campos obrigatórios", {
                description: "Preencha todos os campos antes de enviar.",
            });
            return;
        }

        setLoading(true);
        try {
            await solicitacaoRota(
                Number(form.peso),
                form.origem,
                form.destino,
                form.status,
                solicitante
            );
            onSucesso();
            onClose();
            toast.success("Solicitação enviada!", {
                description: `Frete de ${form.origem} para ${form.destino} Solicitado com sucesso. Em breve estará disponível.`,
            });
        } catch (err) {
            toast.error("Erro ao solicitar frete " + err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (



        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg w-[400px]">
                <h2 className="text-xl font-semibold mb-4">Solicitar Frete</h2>

                <input
                    type="text"
                    placeholder="Origem"
                    value={form.origem}
                    onChange={(e) => handleChange("origem", e.target.value)}
                    className="border p-2 mb-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Destino"
                    value={form.destino}
                    onChange={(e) => handleChange("destino", e.target.value)}
                    className="border p-2 mb-2 w-full"
                />
                <input
                    type="number"
                    placeholder="Peso (kg)"
                    value={form.peso}
                    onChange={(e) => handleChange("peso", e.target.value)}
                    className="border p-2 mb-2 w-full"
                />

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Solicitar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
