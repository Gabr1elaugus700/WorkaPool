import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogHeader
} from "@/components/ui/dialog";
import { fetchCargasFechadas } from "@/services/useCargaFechadaPedido";
import { CargaFechada } from "@/types/cargasFechadasPedido";
import { Separator } from "../ui/separator";


export default function CargasFechadas() {
    const [open, setOpen] = useState(false);
    const [cargasFechadas, setCargasFechadas] = useState<CargaFechada[]>([]);

    useEffect(() => {
        const dataCargas = async () => {
            const response = await fetchCargasFechadas();
            setCargasFechadas(response);
        };

        dataCargas();
    }, []);

    return (
        <>
            {/* <Button variant="outline" onClick={() => setOpen(true)}>Cargas Fechadas</Button> */}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Cargas Fechadas</Button>
                </DialogTrigger> 
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cargas Fechadas:</DialogTitle>
                        <DialogClose />
                        <Separator className="my-4 bg-gray-300" />

                        <div className="mt-4">
                            {cargasFechadas.length > 0 ? (
                                <ul>
                                    {cargasFechadas.map((cargaFechada) => (
                                        <li key={cargaFechada.carga.codCar} className="mb-2">
                                            <span className="font-semibold">Carga: {cargaFechada.carga.destino} </span> - <span>Pedidos: {(cargaFechada.pedidos.map(p => p.id).join(", "))}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nenhuma carga fechada encontrada.</p>
                            )}
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}