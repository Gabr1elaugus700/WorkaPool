
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { Vistoria } from "../models/inspection.model";
import { vistoriasService } from "../services/inspection.service";

interface ModalVisualizarVistoriaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vistoriaId: string;
}

export default function ModalVisualizarVistoria({ open, onOpenChange, vistoriaId }: ModalVisualizarVistoriaProps) {
    const [dadosVistoria, setDadosVistoria] = useState<Vistoria>();


    useEffect(() => {
        const fetchVistoriaId = async () => {
            // Lógica para buscar os dados da vistoria pelo ID
            const vistoriaData = await vistoriasService.getVistoriaById(vistoriaId);
            setDadosVistoria(vistoriaData);
            console.log(vistoriaData);
        }; 
        fetchVistoriaId();
    }, [vistoriaId]);

    if (!dadosVistoria) {
        return <>Carregando...</>; 
    }

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-2xl w-full p-0 rounded-lg sm:rounded-lg"
                    style={{ maxHeight: '70dvh', width: '90vw', borderRadius: 10, overflow: 'auto' }}
                >
                    <DialogHeader className="p-4 border-b flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        <DialogTitle>Visualizar Vistoria</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs text-gray-500">Departamento</span>
                                <span className="font-semibold text-base">{dadosVistoria?.vistoria_dpto?.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Responsável</span>
                                <span className="font-semibold text-base">{dadosVistoria?.responsavel?.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Data</span>
                                <span className="font-semibold text-base">{dadosVistoria?.data_vistoria ? new Date(dadosVistoria.data_vistoria).toLocaleDateString('pt-BR') : "-"}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Checklist</span>
                                <span className="font-semibold text-base">
                                    {dadosVistoria?.checklistVistoria?.[0]?.checklistModeloId ? `Modelo: ${dadosVistoria.checklistVistoria[0].checklistModeloId}` : "-"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Itens do Checklist</h4>
                            <div className="divide-y divide-gray-200 rounded-lg border border-gray-100 bg-gray-50">
                                {dadosVistoria.checklistVistoria && dadosVistoria.checklistVistoria.length > 0 ? (
                                    dadosVistoria.checklistVistoria.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between px-4 py-3">
                                            <div>
                                                <span className="font-medium text-gray-700">{item.checklistItem?.descricao}</span>
                                                {item.observacao && (
                                                    <span className="ml-2 text-xs text-gray-500">({item.observacao})</span>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.checked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.checked ? 'OK' : 'Pendente'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-gray-500 text-sm">Nenhum item encontrado.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }