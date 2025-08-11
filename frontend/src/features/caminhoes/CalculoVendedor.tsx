import { getCaminhaoRota } from "@/shared/api/useFretesService";
import { CaminhaoRotaVinculo } from "@/types/fretes";
import { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle} from '../ui/card';
import { Truck } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "../ui/button";

interface CalculoRotaVendedor {
    rotaBaseId: string | number | undefined;
}

type CaminhaoRotaVinculoWithCusto = CaminhaoRotaVinculo & {
    valorPorKg: number | null;
}

export function CalculoRotaVendedor(props: CalculoRotaVendedor) {
    const [caminhaoRota, setCaminhaoRota] = useState<CaminhaoRotaVinculoWithCusto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [peso, setPeso] = useState("");

    useEffect(() => {
        async function fetchCaminhao() {
            try {
                console.log("Fetching caminhão rota for ID:", props.rotaBaseId);
                setLoading(true);
                setError(null);

                if (props.rotaBaseId !== undefined && props.rotaBaseId !== null) {
                    const response = await getCaminhaoRota(Number(props.rotaBaseId));
                    console.log("Caminhão rota fetched:", response);
                    setCaminhaoRota(Array.isArray(response) ? response : []);
                } else {
                    setCaminhaoRota([]);
                }
            } catch (error) {
                console.error("Error fetching caminhão rota:", error);
                setError("Erro ao carregar caminhões da rota");
                setCaminhaoRota([]);
            } finally {
                setLoading(false);
            }
        }

        fetchCaminhao();
    }, [props.rotaBaseId]);

    const handleCalcularFrete = async  () => {
        console.log("Calculando frete para peso:", peso);
       
        if (!peso || isNaN(Number(peso))) {
            setError("Por favor, informe um peso válido.");
            return;
        }


        const updatedCaminhaoRota = caminhaoRota.map((caminhao) => {
            const valorPorKg = Number(peso) > 0 ? caminhao.custo_total / Number(peso) : null;
            return { ...caminhao, valorPorKg };
        });
        setCaminhaoRota(updatedCaminhaoRota);

    };

    return (
        <>
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">Informe o Peso Para Calcular Frete:</h3>
                    
                    <Input
                        className="w-1/4"
                        placeholder={"Informe o peso para calcular..."}
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                    />
                    <Button onClick={handleCalcularFrete}>Calcular</Button>
                </div>
                <h2>Caminhões para Essa rota: </h2>

                {loading && <p>Carregando caminhões...</p>}

                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && caminhaoRota.length === 0 && (
                    <p>Nenhum caminhão encontrado para esta rota.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-5 gap-3">
                    {!loading && !error && caminhaoRota.length > 0 && (
                        caminhaoRota.map((caminhao: CaminhaoRotaVinculoWithCusto) => (
                            <Card key={caminhao.id} className="bg-green-100 text-green-700 mb-4 mt-2 border-2 border-green-600 shadow-sm b-2 rounded-lg hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="flex flex-col items-center justify-center gap-2 text-center">
                                    <Truck className="w-7 h-7 mb-2" />
                                    <CardTitle className="text-lg">
                                        {caminhao.modelo}
                                        <br />
                                        Valor por kg: R$ {caminhao.valorPorKg !== null && caminhao.valorPorKg !== undefined ? caminhao.valorPorKg.toFixed(2) : "--"}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>
            </div>
            {/* <p>Cálculo Rota Vendedor - Rota Base ID: {props.rotaBaseId}</p> */}
        </>
    );
}