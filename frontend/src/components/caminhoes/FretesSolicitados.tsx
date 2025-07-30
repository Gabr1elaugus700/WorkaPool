"use client";

import { useEffect, useState } from "react";
import { getRotasSolicitadas } from "@/services/useFretesService";
import { getCaminhoes } from "@/services/useCarminhoesService";
import { getParametrosFrete } from "@/services/useParametrosFretesService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Trash } from "lucide-react";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Caminhao } from "@/types/caminhoes";
import { ParametrosFrete } from "@/types/Parametros";

// Função de cálculo fornecida pelo usuário
interface CalcularCustosParams {
  parametrosGlobais: ParametrosFrete | null;
  kmTotal: number;
  freteCaminhao: number;
  pedagioIda: number;
  pedagioVolta: number;
  rotaBaseId: number | string | undefined;
  caminhaoId: number | string;
  consumoCombustivel?: number;
  peso?: number;
  diasViagem?: number;
  qtdePneus?: number;
} 

function calcularCustosPorCaminhao({
  parametrosGlobais,
  kmTotal,
  pedagioIda,
  pedagioVolta,
  rotaBaseId,
  caminhaoId,
  consumoCombustivel,
  peso,
  diasViagem,
  qtdePneus,
}: CalcularCustosParams) {
  // const custoCombustivel = kmTotal * parametrosGlobais.;
  if (!diasViagem) {
    diasViagem = Math.ceil(kmTotal / 500);
  }
  console.log("Dias de viagem calculados:", diasViagem);

  const qtdeDiesel = kmTotal / (consumoCombustivel ?? 1);
  console.log("Quantidade de diesel calculada:", qtdeDiesel);

  const custoCombustivel = qtdeDiesel * (parametrosGlobais?.valor_diesel_s10_sem_icms ?? 0);
  console.log("Valor Diesel S10 sem ICMS:", parametrosGlobais?.valor_diesel_s10_sem_icms);
  console.log("Custo de combustível calculado:", custoCombustivel);

  const calcArla = (qtdeDiesel / (1000 / 50));
  console.log("Custo de Arla calculado:", calcArla);

  const custoArla = calcArla * 3.90;
  console.log("Custo de Arla calculado:", custoArla);

  const custoPneus = (parametrosGlobais?.valor_desgaste_pneus ?? 0) * kmTotal * (qtdePneus || 1);
  console.log("Custo de pneus calculado:", custoPneus);

  const custoMotorista = diasViagem * (parametrosGlobais?.valor_salario_motorista_dia ?? 0);
  console.log("Custo de motorista calculado:", custoMotorista);

  const refeicaoMotorista = diasViagem * (parametrosGlobais?.valor_refeicao_motorista_dia ?? 0);
  console.log("Custo de refeição do motorista calculado:", refeicaoMotorista);

  const ajudaCustoMotorista = diasViagem * (parametrosGlobais?.valor_ajuda_custo_motorista ?? 0);
  console.log("Custo de ajuda de custo do motorista calculado:", ajudaCustoMotorista);

  const chapaDescarga = (parametrosGlobais?.valor_chapa_descarga ?? 0);
  console.log("Custo de chapa de descarga calculado:", chapaDescarga);

  const custoTotal =
    (
      pedagioIda +
      pedagioVolta +
      custoCombustivel +
      custoPneus +
      custoMotorista +
      refeicaoMotorista +
      ajudaCustoMotorista +
      chapaDescarga + custoArla) * (1 + (parametrosGlobais?.margem_lucro ?? 0) / 100);

  console.log("Custo total calculado:", custoTotal);

  const custoPorKg = peso ? custoTotal / peso : custoTotal / 1;
  return {
    rota_base_id: rotaBaseId,
    caminhao_id: caminhaoId,
    pedagio_ida: pedagioIda,
    pedagio_volta: pedagioVolta,
    custo_combustivel: custoCombustivel,
    custo_total: custoTotal,
    salario_motorista_rota: custoMotorista,
    refeicao_motorista_rota: refeicaoMotorista,
    ajuda_custo_motorista_rota: ajudaCustoMotorista,
    chapa_descarga_rota: chapaDescarga,
    desgaste_pneus_rota: custoPneus,
    custo_por_kg: custoPorKg,
  };
}

// Tipos auxiliares
type SolicitacaoFrete = {
  id?: string;
  origem: string;
  destino: string;
  peso: number;
  status: string;
  solicitante_user: string;
};

const statusBgClasses: Record<string, string> = {
  PENDENTE: "bg-yellow-50 border-yellow-400",
  APROVADA: "bg-green-50 border-green-600",
  REJEITADA: "bg-red-50 border-red-600",
};

const statusBadgeClasses: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700",
  APROVADA: "bg-green-100 text-green-700",
  REJEITADA: "bg-red-100 text-red-700",
};

export default function RotasSolicitadasList() {
  const [rotas, setRotas] = useState<SolicitacaoFrete[]>([]);
  const [loading, setLoading] = useState(true);

  const [parametrosGlobais, setParametrosGlobais] = useState<ParametrosFrete | null>(null);
  const [rotaSelecionada, setRotaSelecionada] = useState<SolicitacaoFrete | null>(null);
  const [kmTotal, setKmTotal] = useState("");
  const [diasViagem, setDiasViagem] = useState(""); // Adicionado para controlar o input Dias de Viagem
  const [caminhoesDisponiveis, setCaminhoesDisponiveis] = useState<Caminhao[]>([]);
  const [caminhaoSelecionado, setCaminhaoSelecionado] = useState("");
  const [pedagioIda, setPedagioIda] = useState("");
  const [pedagioVolta, setPedagioVolta] = useState("");
  const [caminhoesVinculados, setCaminhoesVinculados] = useState<
    { id: string; modelo: string; pedagioIda: number; pedagioVolta: number; consumo_medio: number; pneus: number }[]
  >([]);
  const [mostrandoFormularioCaminhao, setMostrandoFormularioCaminhao] = useState(false);

  // Custos em tempo real para exibir na tela
  type CustosPorCaminhao = ReturnType<typeof calcularCustosPorCaminhao>;
  const [custosPorCaminhao, setCustosPorCaminhao] = useState<CustosPorCaminhao[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getRotasSolicitadas();
        setRotas(data);
      } catch (err) {
        console.error("Erro ao carregar rotas:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (rotaSelecionada) {
      getCaminhoes()
        .then((data) => setCaminhoesDisponiveis(data))
        .catch((err) => console.error("Erro ao buscar caminhões", err));
    }
  }, [rotaSelecionada]);

  useEffect(() => {
    async function carregarParametros() {
      const parametros = await getParametrosFrete();
      setParametrosGlobais(parametros);
    }
    carregarParametros();
  }, []);

  function adicionarCaminhao() {
    if (!caminhaoSelecionado || !pedagioIda || !pedagioVolta) return;

    const caminhaoInfo = caminhoesDisponiveis.find((c) => c.id === caminhaoSelecionado);
    if (!caminhaoInfo) return;

    setCaminhoesVinculados((prev) => [
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
    setMostrandoFormularioCaminhao(false);
  }

  function removerCaminhao(id: string) {
    setCaminhoesVinculados((prev) => prev.filter((c) => c.id !== id));
  }

  // Cálculo dos custos em tempo real para exibir na tela
  useEffect(() => {
    if (
      parametrosGlobais &&
      kmTotal &&
      caminhoesVinculados.length > 0
    ) {
      const km = parseFloat(kmTotal);
      const custos = caminhoesVinculados.map((caminhao) =>
        calcularCustosPorCaminhao({
          parametrosGlobais,
          kmTotal: km,
          freteCaminhao: 0, // ajuste se precisar
          pedagioIda: caminhao.pedagioIda,
          pedagioVolta: caminhao.pedagioVolta,
          rotaBaseId: rotaSelecionada?.id,
          caminhaoId: caminhao.id,
          diasViagem: parseFloat(diasViagem),
          peso: rotaSelecionada?.peso, // Peso da carga, se necessário
          consumoCombustivel: caminhao.consumo_medio,
          qtdePneus: caminhao.pneus || 0,
        })
      );
      setCustosPorCaminhao(custos);
    } else {
      setCustosPorCaminhao([]);
    }
  }, [parametrosGlobais, kmTotal, caminhoesVinculados, rotaSelecionada, diasViagem]);

  async function salvarVinculo() {
    const parametros = await getParametrosFrete();
    const km = parseFloat(kmTotal);

    const custosPorCaminhao = caminhoesVinculados.map((caminhao) =>
      calcularCustosPorCaminhao({
        parametrosGlobais: parametros,
        kmTotal: km,
        freteCaminhao: 0, // ajuste se precisar
        pedagioIda: caminhao.pedagioIda,
        pedagioVolta: caminhao.pedagioVolta,
        rotaBaseId: rotaSelecionada?.id,
        caminhaoId: caminhao.id,
        consumoCombustivel: caminhao.consumo_medio
      })
    );

    console.log("Salvar rota", rotaSelecionada?.id, {
      kmTotal,
      caminhoes: caminhoesVinculados,
      custosPorCaminhao,
    });

    setRotaSelecionada(null);
    setKmTotal("");
    setCaminhoesVinculados([]);
  }

  if (loading) return <p>Carregando...</p>;
  if (rotas.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma rota pendente</p>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rotas.map((rota) => (
          <Card
            key={rota.id}
            className={clsx(
              "border-2 transition-all hover:shadow-lg",
              statusBgClasses[rota.status] || "bg-white border-gray-300"
            )}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold">
                  {rota.origem} → {rota.destino}
                </CardTitle>
                <button onClick={() => setRotaSelecionada(rota)}>
                  <Pencil />
                </button>
              </div>
              <CardDescription>
                Solicitado por: <strong>{rota.solicitante_user}</strong>
              </CardDescription>
              <span
                className={clsx(
                  "text-xs px-2 py-1 rounded font-semibold",
                  statusBadgeClasses[rota.status]
                )}
              >
                {rota.status}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Peso: {rota.peso} kg</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!rotaSelecionada} onOpenChange={() => setRotaSelecionada(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Caminhões à Rota</DialogTitle>
            <DialogDescription>
              Informe o KM total e associe caminhões a essa rota.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <Input type="text" value={rotaSelecionada?.destino || ""} />
            </div>

            {caminhoesVinculados.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Caminhões vinculados</p>
                <ul className="space-y-1">
                  {caminhoesVinculados.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between items-center border p-2 rounded-md text-sm"
                    >
                      <span>
                        {c.modelo} | Ida: R$ {c.pedagioIda.toFixed(2)} | Volta: R$ {c.pedagioVolta.toFixed(2)}
                      </span>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removerCaminhao(c.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {custosPorCaminhao.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Custo por caminhão (estimativa)</p>
                <ul className="space-y-1">
                  {custosPorCaminhao.map((c) => (
                    <li key={c.caminhao_id} className="border p-2 rounded-md text-xs">
                      <div>
                        <strong>Caminhão:</strong> {c.caminhao_id}
                      </div>
                      <div>
                        <strong>Custo total:</strong> R$ {c.custo_total.toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!mostrandoFormularioCaminhao ? (
              <Button onClick={() => setMostrandoFormularioCaminhao(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Associar Caminhão
              </Button>
            ) : (
              <div className="border p-3 rounded-md space-y-3">
                <Select value={caminhaoSelecionado} onValueChange={(v) => setCaminhaoSelecionado(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caminhão" />
                  </SelectTrigger>
                  <SelectContent>
                    {caminhoesDisponiveis.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.modelo}
                      </SelectItem>
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

                <Button onClick={adicionarCaminhao} size="sm">
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={salvarVinculo}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}