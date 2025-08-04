"use client";
import { useEffect, useState } from "react";
import { associarCaminhaoRota, atualizarCaminhaoRota, atualizarSolicitacaoRota, getCaminhaoRota, getRotas, getRotasSolicitadas, rotaBase } from "@/services/useFretesService";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Caminhao } from "@/types/caminhoes";
import { ParametrosFrete } from "@/types/Parametros";
import { CaminhaoRotaVinculo } from "@/types/fretes";

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
  if (!diasViagem) {
    diasViagem = Math.ceil(kmTotal / 500);
  }

  const qtdeDiesel = kmTotal / (consumoCombustivel ?? 1);
  const custoCombustivel = qtdeDiesel * (parametrosGlobais?.valor_diesel_s10_sem_icms ?? 0);
  const calcArla = (qtdeDiesel / (1000 / 50));
  const custoArla = calcArla * 3.90;
  const custoPneus = (parametrosGlobais?.valor_desgaste_pneus ?? 0) * kmTotal * (qtdePneus || 1);
  const custoMotorista = diasViagem * (parametrosGlobais?.valor_salario_motorista_dia ?? 0);
  const refeicaoMotorista = diasViagem * (parametrosGlobais?.valor_refeicao_motorista_dia ?? 0);
  const ajudaCustoMotorista = diasViagem * (parametrosGlobais?.valor_ajuda_custo_motorista ?? 0);
  const chapaDescarga = (parametrosGlobais?.valor_chapa_descarga ?? 0);

  const custoTotal =
    (
      pedagioIda +
      pedagioVolta +
      custoCombustivel +
      custoPneus +
      custoMotorista +
      refeicaoMotorista +
      ajudaCustoMotorista +
      chapaDescarga +
      custoArla) * (1 + (parametrosGlobais?.margem_lucro ?? 0) / 100);

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

type SolicitacaoFrete = {
  id?: string;
  origem: string;
  destino: string;
  peso: number;
  status: string;
  solicitante_user: string;
  km_total?: number;
  dias_viagem?: number;
  rotaBaseId?: number;
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
  const [caminhoesJaVinculados, setCaminhoesJaVinculados] = useState<CaminhaoRotaVinculo[]>([]);
  const [mostrandoFormularioCaminhao, setMostrandoFormularioCaminhao] = useState(false);

  type CustosPorCaminhao = ReturnType<typeof calcularCustosPorCaminhao>;
  const [custosPorCaminhao, setCustosPorCaminhao] = useState<CustosPorCaminhao[]>([]);
  const [rotaBaseId, setRotaBaseId] = useState<number | null>(null);

  const [idParaFechar, setIdParaFechar] = useState<number | null>(null);
  const [openDialogConfirm, setOpenDialogConfirm] = useState(false);

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
    carregarRotasSolicitas();
  }, []);

  useEffect(() => {
    if (rotaSelecionada) {
      getCaminhoes()
        .then((data) => setCaminhoesDisponiveis(data))
        .catch((err) => console.error("Erro ao buscar caminhões", err));
    }
  }, [rotaSelecionada, rotaBaseId]);

  useEffect(() => {
    async function carregarCaminhoesVinculados() {
      if (rotaBaseId) {
        console.log("Carregando caminhões vinculados para rota base ID:", rotaBaseId);
        const vinculados = await getCaminhaoRota(rotaBaseId);
        setCaminhoesJaVinculados(vinculados); // mantenha objetos completos!
      }
    }
    carregarCaminhoesVinculados();
  }, [rotaBaseId]);

  useEffect(() => {
    async function carregarParametros() {
      const parametros = await getParametrosFrete();
      setParametrosGlobais(parametros);
    }
    carregarParametros();
  }, []);

  async function carregarRotasSolicitas() {
    try {
      const data = await getRotasSolicitadas();
      setRotas(data);
    } catch (error) {
      console.error("Erro ao carregar rotas solicitadas:", error);
    }
  }

  function handleFecharSolicitacao(rota: SolicitacaoFrete) {
      setIdParaFechar(rota.id !== undefined ? Number(rota.id) : null);
      setOpenDialogConfirm(true);
    }

    async function confirmarFechamento() {
      if (idParaFechar) {
        await atualizarSolicitacaoRota(Number(idParaFechar));
        console.log("Solicitação de rota atualizada:", idParaFechar);
        setOpenDialogConfirm(false);
        setIdParaFechar(null);
        await carregarRotasSolicitas();
      }
    }
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

  function removerCaminhao(id: string | number) {
    setCaminhoesVinculados((prev) => prev.filter((c) => c.id !== id));
  }

  // Função para garantir o rota_base_id (busca ou cria se não existir)
  async function garantirRotaBaseId(origem: string, destino: string, km: number, dias: number): Promise<number | null> {
    console.log("Garantindo rota base ID...");
    if (!origem || !destino || !km || !dias) {
      console.error("Parâmetros insuficientes para garantir rota base ID");
      return null;
    }
    const rotas = await getRotas();
    const rota = rotas.find((r) => r.destino === destino && r.origem === origem);
    if (rota) {
      const id = rota.id !== undefined ? Number(rota.id) : null;
      setRotaBaseId(id);
      console.log("Rota já existe, usando ID:", id);
      return id;
    } else {
      const novaRota = await rotaBase(origem, destino, km, dias);
      const id = novaRota.id !== undefined ? Number(novaRota.id) : null;
      setRotaBaseId(id);
      console.log("Nova rota criada, usando ID:", id);
      return id;
    }
  }

  // Cálculo dos custos em tempo real para exibir na tela
  useEffect(() => {
    async function calcularCustos() {
      if (
        parametrosGlobais &&
        kmTotal &&
        caminhoesVinculados.length > 0 &&
        rotaSelecionada?.origem &&
        rotaSelecionada?.destino &&
        diasViagem
      ) {
        const km = parseFloat(kmTotal);
        const dias = parseFloat(diasViagem);
        // Busca ou cria a rota antes do cálculo só para garantir id correto
        const rota_base_id = await garantirRotaBaseId(rotaSelecionada.origem, rotaSelecionada.destino, km, dias);

        const custos = caminhoesVinculados.map((caminhao) =>
          calcularCustosPorCaminhao({
            parametrosGlobais,
            kmTotal: km,
            freteCaminhao: 0,
            pedagioIda: caminhao.pedagioIda,
            pedagioVolta: caminhao.pedagioVolta,
            rotaBaseId: rota_base_id ?? undefined,
            caminhaoId: caminhao.id,
            diasViagem: dias,
            peso: rotaSelecionada?.peso,
            consumoCombustivel: caminhao.consumo_medio,
            qtdePneus: caminhao.pneus || 0,
          })
        );
        setCustosPorCaminhao(custos);
      } else {
        setCustosPorCaminhao([]);
      }
    }
    calcularCustos();
  }, [parametrosGlobais, kmTotal, caminhoesVinculados, rotaSelecionada, diasViagem]);

  async function salvarVinculo() {
    if (
      !rotaSelecionada?.origem ||
      !rotaSelecionada?.destino ||
      !kmTotal ||
      !diasViagem
    ) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const parametros = await getParametrosFrete();
    const km = parseFloat(kmTotal);
    const dias = parseFloat(diasViagem);

    // Garante que a rota existe e pega o id correto
    const rota_base_id = await garantirRotaBaseId(rotaSelecionada.origem, rotaSelecionada.destino, km, dias);
    console.log("Rota base ID para salvar Caminhão: ", rota_base_id);
    // Carregue vínculos do backend como array de objetos completos!
    const caminhoesJaVinculados = await getCaminhaoRota(Number(rota_base_id));

    const custosPorCaminhao = caminhoesVinculados.map((caminhao) =>
      calcularCustosPorCaminhao({
        parametrosGlobais: parametros,
        kmTotal: km,
        freteCaminhao: 0,
        pedagioIda: caminhao.pedagioIda,
        pedagioVolta: caminhao.pedagioVolta,
        rotaBaseId: rota_base_id ?? undefined,
        caminhaoId: caminhao.id,
        diasViagem: dias,
        peso: rotaSelecionada.peso,
        consumoCombustivel: caminhao.consumo_medio,
        qtdePneus: caminhao.pneus || 0,
      })
    );

    console.log("Custos por caminhão calculados:", custosPorCaminhao);
    for (const custo of custosPorCaminhao) {
      console.log("Caminhões já vinculados:", caminhoesJaVinculados);

      // Procura se já existe vínculo para este caminhão
      const jaVinculado = caminhoesJaVinculados.find(
        (v: { caminhao_id: string | number }) => String(v.caminhao_id) === String(custo.caminhao_id)
      );

      if (!jaVinculado) {
        // Não existe vínculo: criar
        console.log("Associando novo caminhão à rota base:", custo);
        await associarCaminhaoRota(
          Number(custo.rota_base_id),
          Number(custo.caminhao_id),
          Number(custo.pedagio_ida),
          Number(custo.pedagio_volta),
          Number(custo.custo_combustivel),
          Number(custo.custo_total),
          Number(custo.salario_motorista_rota),
          Number(custo.refeicao_motorista_rota),
          Number(custo.ajuda_custo_motorista_rota),
          Number(custo.chapa_descarga_rota),
          Number(custo.desgaste_pneus_rota)
        );
      } else {
        // Já existe, comparar os campos relevantes
        const dadosIguais =
          jaVinculado.pedagio_ida === custo.pedagio_ida &&
          jaVinculado.pedagio_volta === custo.pedagio_volta &&
          jaVinculado.custo_combustivel === custo.custo_combustivel &&
          jaVinculado.custo_total === custo.custo_total &&
          jaVinculado.salario_motorista_rota === custo.salario_motorista_rota &&
          jaVinculado.refeicao_motorista_rota === custo.refeicao_motorista_rota &&
          jaVinculado.ajuda_custo_motorista_rota === custo.ajuda_custo_motorista_rota &&
          jaVinculado.chapa_descarga_rota === custo.chapa_descarga_rota &&
          jaVinculado.desgaste_pneus_rota === custo.desgaste_pneus_rota;

        if (!dadosIguais) {
          await atualizarCaminhaoRota(Number(jaVinculado.rota_base_id), Number(jaVinculado.caminhao_id),
            {
              pedagio_ida: custo.pedagio_ida,
              pedagio_volta: custo.pedagio_volta,
              custo_combustivel: custo.custo_combustivel,
              custo_total: custo.custo_total,
              salario_motorista_rota: custo.salario_motorista_rota,
              refeicao_motorista_rota: custo.refeicao_motorista_rota,
              ajuda_custo_motorista_rota: custo.ajuda_custo_motorista_rota,
              chapa_descarga_rota: custo.chapa_descarga_rota,
              desgaste_pneus_rota: custo.desgaste_pneus_rota
            });
        }
        // Se for igual, não faz nada!
      }
    }

    
    setKmTotal("");
    setDiasViagem("");
    setCaminhoesVinculados([]);
    setCustosPorCaminhao([]);
    carregarRotasSolicitas();
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
                <button onClick={async () => {
                  setRotaSelecionada(rota); // salva a solicitação (id)
                  setKmTotal(String(rota.km_total || ""));
                  setDiasViagem(String(rota.dias_viagem || ""));

                  if (rota.rotaBaseId) {
                    // Só busca caminhões vinculados SE existe rotaBaseId!
                    setRotaBaseId(Number(rota.rotaBaseId));
                    const vinculados = await getCaminhaoRota(Number(rota.rotaBaseId));
                    setCaminhoesJaVinculados(vinculados);
                  } else {
                    setRotaBaseId(null);
                    setCaminhoesJaVinculados([]);
                  }
                  setMostrandoFormularioCaminhao(false);
                  setCaminhoesVinculados([]);
                  setCustosPorCaminhao([]);
                }}>
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
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Vincular Caminhões à Rota</DialogTitle>
            <DialogDescription>
              Informe o KM total e associe caminhões a essa rota.
            </DialogDescription>
          </DialogHeader>

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
              <Input type="text" value={rotaSelecionada?.destino || ""} />
            </div>

            {caminhoesJaVinculados.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Caminhões já vinculados a esta rota</p>
                <ul className="space-y-1">
                  {caminhoesJaVinculados.map((c) => (
                    <li
                      key={c.caminhao_id}
                      className="flex justify-between items-center border p-2 rounded-md text-sm"
                    >
                      <span>
                        {/* Ajuste os campos conforme o objeto retornado do backend */}
                        Caminhão: {c.modelo ?? c.caminhao_id} | Ida: R$ {Number(c.pedagio_ida).toFixed(2)} | Volta: R$ {Number(c.pedagio_volta).toFixed(2)}
                      </span>
                      {/* Se quiser permitir remover o vínculo direto daqui, implemente a função removerCaminhaoVinculado */}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removerCaminhao(c.caminhao_id)}
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
            <Button onClick={() => {salvarVinculo(); handleFecharSolicitacao(rotaSelecionada as SolicitacaoFrete);}}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={openDialogConfirm} onOpenChange={setOpenDialogConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja Fechar a Solicitação de Rota?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDialogConfirm(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarFechamento}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}