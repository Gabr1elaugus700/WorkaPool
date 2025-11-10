import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Pencil, MapPin, User, CircleAlert, Activity, Plus, CircleCheckBig } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { osService } from "../services/osService";
import { OrdemServico } from "../models/osModel";
import { StatusType, PrioridadeType } from "../types/osType";
import FormField from "@/components/ui/FormField";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { getBaseUrl } from "@/lib/apiBase";
import { Dialog as ImgDialog, DialogContent as ImgDialogContent, DialogTrigger as ImgDialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";


interface StatusInfo {
    label: string;
    classes: string;
}

// Cores: 
const STATUS_STYLES: Record<StatusType, StatusInfo> = {
    ABERTA: {
        label: "Pendente",
        classes: "text-red-500",
    },
    EM_ANDAMENTO: {
        label: "Em andamento",
        classes: "text-yellow-500",
    },
    FINALIZADA: {
        label: "Concluído",
        classes: "text-green-500",
    },
    CANCELADA: {
        label: "Cancelada",
        classes: "text-rose-500",
    },
};

const PRIORIDADE_COLOR: Record<PrioridadeType, string> = {
    ALTA: "text-red-500",
    MEDIA: "text-orange-500",
    BAIXA: "text-green-500",
};

interface EditarOsProps {
    idOs?: string;
    open: boolean;
    setOpen?: (open: boolean) => void;
}

export const EditOsButton = ({ idOs, open, setOpen }: EditarOsProps) => {
    const [osData, setOsData] = useState<OrdemServico | null>(null);
    const [newStatus, setNewStatus] = useState<StatusType | "">("");
    const [newCompletionDate, setNewCompletionDate] = useState<string>("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ newStatus, newCompletionDate });
        setLoading(true);

        try {
            if (!idOs) return;
            if (!newStatus || !newCompletionDate) {
                toast.error("Por favor, preencha todos os campos obrigatórios.");
                setLoading(false);
                return;
            }
            const date = newCompletionDate ? new Date(newCompletionDate) : null;

            if (newStatus && date) {
                const updatedOs = await osService.update(idOs, {
                    status: newStatus,
                    data_conclusao: date ? date.toISOString().split("T")[0] : "",
                });

                console.log(updatedOs);
                setLoading(false);
            }

            if (setOpen) setOpen(false);
            toast.success("Ordem de Serviço atualizada com sucesso!");

        } catch (error) {
            setError("Erro ao atualizar a Ordem de Serviço.");
            setLoading(false);
            console.error("Erro ao atualizar a Ordem de Serviço:", error);
            toast.error("Erro ao atualizar a Ordem de Serviço.");
        }
    };

    useEffect(() => {
        // Lógica para carregar dados da OS
        const fetchOs = async () => {
            if (idOs) {
                const data = await osService.getById(idOs);
                console.log(data);
                setOsData(data);
            }
        };
        fetchOs();
    }, [open, idOs]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Pencil
                        className="w-8 h-8 md:h-5 md:w-5 text-primary hover:opacity-70 cursor-pointer"
                        onClick={() => setOpen && setOpen(true)}
                    />

                </DialogTrigger>
                <DialogContent
                    className="max-w-2xl w-full rounded-lg sm:rounded-lg"
                    style={{
                        maxHeight: '90dvh',
                        width: '90vw',
                        borderRadius: 10,
                        padding: 40,
                        overflow: 'auto',
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Ordem de Serviço</DialogTitle>
                        <Separator />
                    </DialogHeader>
                    <section className="mb-4 gap-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-subtleGray dark:bg-subtle-dark p-4 rounded-lg shadow-lg">
                            <div>
                                <span className="block text-xs text-gray-500">Problema</span>
                                <span className="text-lg font-medium">{osData?.problema || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Descrição</span>
                                <p className="text-base">{osData?.descricao || "-"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 grid-rows-3 gap-4 bg-subtleGray dark:bg-subtle-dark p-4 rounded-lg mt-6 shadow-lg">
                            <div className="flex items-center gap-3">
                                <Activity className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="block text-xs text-gray-500">Status</span>
                                    <span
                                        className={clsx(
                                            "text-base",
                                            "sm:text-lg",
                                            "md:text-xl",
                                            "font-bold",
                                            STATUS_STYLES[osData?.status as StatusType]?.classes || "bg-gray-100 text-gray-800",

                                        )}
                                    > {osData?.status ? osData.status.charAt(0).toUpperCase() + osData.status.slice(1).toLocaleLowerCase() : "-"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <CircleAlert className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="block text-xs text-gray-500">Prioridade</span>
                                    <span
                                        className={clsx(
                                            "text-base",
                                            "sm:text-lg",
                                            "md:text-xl",
                                            "font-bold",
                                            PRIORIDADE_COLOR[osData?.prioridade as PrioridadeType] || "bg-gray-100 text-gray-800",

                                        )}
                                    >{osData?.prioridade ? osData.prioridade.charAt(0).toUpperCase() + osData.prioridade.slice(1).toLocaleLowerCase() : "-"}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Data de Criação</span>
                                    <span
                                        className="
                                            text-base
                                            sm:text-lg
                                            md:text-xl
                                            font-medium
                                        "
                                    >
                                        {osData?.data_criacao
                                            ? new Date(osData.data_criacao).toLocaleDateString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Localização</span>
                                    <span className="text-lg font-medium">{osData?.localizacao || "-"}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 col-span-2">
                                <User className="w-6 h-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Solicitante</span>
                                    <span
                                        className="
                                            text-base
                                            sm:text-lg
                                            md:text-xl
                                            font-medium
                                        "
                                    >
                                        {osData?.email_solicitante || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-subtleGray dark:bg-subtle-dark p-4 rounded-lg mt-6 shadow-lg">
                            <h2 className="text-lg font-medium mb-2">Imagens do Problema</h2>
                            <div
                                className={clsx(
                                    "grid gap-4 grid-cols-4",
                                )}
                            >
                                {osData?.imagens && osData.imagens.length > 0 ? (
                                    osData.imagens.slice(0, 4).map((foto, idx) => {
                                        let src = "";
                                        if (typeof foto === "string") {
                                            src = foto;
                                        } else if (foto && typeof foto === "object" && "imagem_url" in foto) {
                                            src = `${getBaseUrl()}${foto.imagem_url}`;
                                        }
                                        return (
                                            <ExpandImage key={idx} src={src} alt={`Foto ${idx + 1}`} />
                                        );
                                    })
                                ) : (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                                        >
                                            <Plus className="w-8 h-8 text-gray-400" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="bg-subtleGray dark:bg-subtle-dark p-4 rounded-lg mt-6 shadow-lg">
                            <h2 className="text-lg font-medium mb-2">Atualizar Status</h2>
                            <FormField
                                id="status"
                                label="Status"
                                value={newStatus}
                                onChange={value => setNewStatus(value as StatusType)}
                                placeholder="Selecione o status"
                                type="select"
                                options={[
                                    { value: "ABERTA", label: "Em Aberto" },
                                    { value: "EM_ANDAMENTO", label: "Em Andamento" },
                                    { value: "FINALIZADA", label: "Finalizada" },
                                    { value: "CANCELADA", label: "Cancelada" },
                                ]}
                            />
                            <FormField
                                id="data_conclusao"
                                label="Data de Conclusão"
                                value={newCompletionDate}
                                onChange={setNewCompletionDate}
                                placeholder="dd/mm/aaaa"
                                type="date"
                            />
                        </div>
                    </section>
                    {error && (
                        toast.error(error)
                    )}
                    <div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                            onClick={handleSubmit}
                        >
                            <CircleCheckBig className="w-6 h-6 text-white" />
                            {loading ? "Salvando..." : <>Atualizar Ordem de Serviço</>}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
};

function ExpandImage({ src, alt }: { src: string; alt: string }) {
    const [open, setOpen] = useState(false);
    return (
        <ImgDialog open={open} onOpenChange={setOpen}>
            <ImgDialogTrigger asChild>
                <div
                    className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => setOpen(true)}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="object-cover w-full h-full"
                    />
                </div>
            </ImgDialogTrigger>
            <ImgDialogContent className="flex items-center justify-center bg-black bg-opacity-90 p-0 max-w-3xl">
                <img src={src} alt={alt} className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            </ImgDialogContent>
        </ImgDialog>
    );
}
