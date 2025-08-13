import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Caminhao } from "../types/caminhoes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { ParametrosFrete } from "@/shared/types/Parametros";
import { garantirRotaBaseId } from "@/shared/utils/obtemIdRotas";
import { calcularCustosPorCaminhao } from "@/shared/utils/calculoFrete";


interface AssociarCaminhaoFormProps {
    rotaSelecionada?: { origem?: string; destino?: string; };
    caminhoesDisponiveis: Caminhao[];
    parametrosGlobais: ParametrosFrete | null;
    onVincular: (dados: { kmTotal: string; diasViagem: string; caminhoes: CaminhaoRotaVinculo[] }) => void;
    onSolicitarFechamento: (dados: { kmTotal: string; diasViagem: string; caminhoes: CaminhaoRotaVinculo[] }) => void;
}

type CaminhaoRotaVinculo = {
    id: string;
    modelo: string;
    pedagioIda: number;
    pedagioVolta: number;
    consumo_medio: number;
    pneus: number;
};

export function AssociarCaminhaoForm({ rotaSelecionada, caminhoesDisponiveis, parametrosGlobais, onSolicitarFechamento }: AssociarCaminhaoFormProps) {
    const [kmTotal, setKmTotal] = useState("");
    const [diasViagem, setDiasViagem] = useState("");
    const [caminhaoSelecionado, setCaminhaoSelecionado] = useState("");
    const [pedagioIda, setPedagioIda] = useState("");
    const [pedagioVolta, setPedagioVolta] = useState("");
    const [caminhoes, setCaminhoes] = useState<CaminhaoRotaVinculo[]>([]);
    interface CustoCaminhao {
        caminhaoId: string | number;
        custo_total: number;
        // Adicione outros campos conforme retornados por calcularCustosPorCaminhao
    }

    const [custosPorCaminhao, setCustosPorCaminhao] = useState<CustoCaminhao[]>([]);

    function adicionarCaminhao() {
        const caminhaoInfo = caminhoesDisponiveis.find((c) => c.id === caminhaoSelecionado);
        if (!caminhaoSelecionado || !pedagioIda || !pedagioVolta || !caminhaoInfo) return;


        // const caminhaoInfo = caminhoesDisponiveis.find((c) => c.id === caminhaoSelecionado);
        if (!caminhaoInfo) return;

        setCaminhoes((prev) => [
            ...prev,
            {
                id: caminhaoInfo.id,
                modelo: caminhaoInfo.modelo,
                pedagioIda: parseFloat(pedagioIda),
                pedagioVolta: parseFloat(pedagioVolta),
                consumo_medio: caminhaoInfo.consumo_medio_km_l,
                pneus: caminhaoInfo.pneus || 0,
            },
        ]);

        setCaminhaoSelecionado("");
        setPedagioIda("");
        setPedagioVolta("");
    }


    useEffect(() => {
        async function calcularCustos() {
            if (
                parametrosGlobais &&
                kmTotal &&
                caminhoesDisponiveis.length > 0 &&
                rotaSelecionada?.origem &&
                rotaSelecionada?.destino &&
                diasViagem
            ) {
                const km = parseFloat(kmTotal);
                const dias = parseFloat(diasViagem);
                // Busca ou cria a rota antes do cálculo só para garantir id correto
                const rota_base_id = await garantirRotaBaseId(rotaSelecionada.origem, rotaSelecionada.destino, km, dias);

                const custosRaw = caminhoes.map((caminhao) =>
                    calcularCustosPorCaminhao({
                        parametrosGlobais,
                        kmTotal: km,
                        freteCaminhao: 0,
                        pedagioIda: caminhao.pedagioIda,
                        pedagioVolta: caminhao.pedagioVolta,
                        rotaBaseId: rota_base_id ?? undefined,
                        caminhaoId: caminhao.id,
                        diasViagem: dias,
                        consumoCombustivel: caminhao.consumo_medio,
                        qtdePneus: caminhao.pneus || 0,
                    })
                );
                const custos = custosRaw.map((c): CustoCaminhao => ({
                    caminhaoId: c.caminhao_id,
                    custo_total: c.custo_total,
                    // Adicione outros campos se necessário
                }));
                setCustosPorCaminhao(custos);
            } else {
                setCustosPorCaminhao([]);
            }
        }
        calcularCustos();
    }, [parametrosGlobais, kmTotal, caminhoes, caminhoesDisponiveis.length, rotaSelecionada, diasViagem]);


    return (
        <div className="max-h-[500px] overflow-y-auto space-y-4 p-2">
            <div>
                <label className="text-sm font-medium">KM Total da Rota</label>
                <Input
                    type="number"
                    value={kmTotal}
                    onChange={(e) => setKmTotal(e.target.value)}
                    placeholder="Ex: 320"
                />
            </div>
            <div>
                <label className="text-sm font-medium">Dias De Viagem</label>
                <Input
                    type="number"
                    value={diasViagem}
                    onChange={(e) => setDiasViagem(e.target.value)}
                    placeholder="Ex: 5"
                />
            </div>
            <div>
                <label className="text-sm font-medium">Origem</label>
                <Input type="text" value={rotaSelecionada?.origem || ""} disabled />
            </div>
            <div>
                <label className="text-sm font-medium">Destino</label>
                <Input type="text" value={rotaSelecionada?.destino || ""} disabled />
            </div>

            <div className="border p-3 rounded-md space-y-3">
                <Select value={caminhaoSelecionado} onValueChange={setCaminhaoSelecionado}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um caminhão" />
                    </SelectTrigger>
                    <SelectContent>
                        {caminhoesDisponiveis.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.modelo}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="number"
                    placeholder="Pedágio ida"
                    value={pedagioIda}
                    onChange={(e) => setPedagioIda(e.target.value)}
                />
                <Input
                    type="number"
                    placeholder="Pedágio volta"
                    value={pedagioVolta}
                    onChange={(e) => setPedagioVolta(e.target.value)}
                />
                <Button onClick={adicionarCaminhao} size="sm">Adicionar Caminhão</Button>
            </div>

            {caminhoes.length > 0 && (
                <div>
                    <p className="font-semibold text-sm mb-2">Caminhões a vincular</p>
                    <ul className="space-y-1">
                        {caminhoes.map((c) => (
                            <li key={c.id} className="border p-2 rounded-md text-xs">
                                {c.modelo} - Ida: R$ {c.pedagioIda} - Volta: R$ {c.pedagioVolta}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {custosPorCaminhao.length > 0 && (
                <div>
                    <p className="font-semibold text-sm mb-2">Custo por caminhão (estimativa)</p>
                    <ul className="space-y-1">
                        {custosPorCaminhao.map((c, i) => (
                            <li key={i} className="border p-2 rounded-md text-xs">
                                <div>
                                    <strong>Caminhão:</strong> {c.caminhaoId}
                                </div>
                                <div>
                                    <strong>Custo total:</strong> R$ {c.custo_total?.toFixed(2)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Button
                onClick={() => onSolicitarFechamento({ kmTotal, diasViagem, caminhoes })}
                className="mt-4 w-full"
            >
                Fechar Solicitação
            </Button>
        </div>
    );
}
