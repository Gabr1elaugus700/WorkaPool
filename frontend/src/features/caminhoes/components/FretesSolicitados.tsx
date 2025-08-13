"use client";
import { useEffect, useState } from "react";

// Importando serviços e
import { associarCaminhaoRota, atualizarCaminhaoRota, atualizarSolicitacaoRota, getCaminhaoRota, getRotasSolicitadas } from "@/services/useFretesService";
import { getCaminhoes } from "@/services/useCarminhoesService";
import { getParametrosFrete } from "@/services/useParametrosFretesService";
import clsx from "clsx";

// UI Components
import { Pencil } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
import { Caminhao } from "@/shared/types/caminhoes";
import { ParametrosFrete } from "@/shared/types/Parametros";
import { CaminhaoRotaVinculo } from "@/shared/types/fretes";
import { SolicitacaoFrete } from "@/shared/types/solicitacaoFrete"

// Componentes Formação
import { AssociarCaminhaoForm } from "./AssociarCaminhaoForm";
import { CaminhoesVinculadosList } from "./CaminhoesVinculadosList"
import { DialogConfirm } from "./ConfirmacaoDialog";

// Funções 
import { calcularCustosPorCaminhao } from "@/shared/utils/calculoFrete"
import { garantirRotaBaseId } from "@/shared/utils/obtemIdRotas";

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
  const [caminhoesDisponiveis, setCaminhoesDisponiveis] = useState<Caminhao[]>([]);
  const [caminhoesJaVinculados, setCaminhoesJaVinculados] = useState<CaminhaoRotaVinculo[]>([]);
  const [rotaBaseId, setRotaBaseId] = useState<number | null>(null);
  const [dadosParaVincular, setDadosParaVincular] = useState<{
    kmTotal: string;
    diasViagem: string;
    caminhoes: {
      id: string;
      modelo: string;
      pedagioIda: number;
      pedagioVolta: number;
      consumo_medio: number;
      pneus: number;
    }[];
  } | null>(null);


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

  function removerCaminhao(id: string | number) {
    setCaminhoesJaVinculados((prev) => prev.filter((c) => c.id !== id));
  }
  // Cálculo dos custos em tempo real para exibir na tela

  async function salvarVinculo(kmTotal: string, diasViagem: string, caminhoes: { id: string; modelo: string; pedagioIda: number; pedagioVolta: number; consumo_medio: number; pneus: number }[]) {
    if (!rotaSelecionada?.origem || !rotaSelecionada?.destino || !kmTotal || !diasViagem) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const parametros = await getParametrosFrete();
    const km = parseFloat(kmTotal);
    const dias = parseFloat(diasViagem);
    const rota_base_id = await garantirRotaBaseId(rotaSelecionada.origem, rotaSelecionada.destino, km, dias);
    console.log("Rota base ID para salvar Caminhão: ", rota_base_id);
    const caminhoesJaVinculados = await getCaminhaoRota(Number(rota_base_id));

    for (const caminhao of caminhoes) {
      // Calcule os custos para cada caminhão recebido do filho
      const custo = calcularCustosPorCaminhao({
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
      });

      const jaVinculado = caminhoesJaVinculados.find(
        (v: { caminhao_id: string | number }) => String(v.caminhao_id) === String(custo.caminhao_id)
      );

      if (!jaVinculado) {
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
          await atualizarCaminhaoRota(Number(jaVinculado.rota_base_id), Number(jaVinculado.caminhao_id), {
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
      }
    }
    atualizarSolicitacaoRota(rotaSelecionada.id ? Number(rotaSelecionada.id) : 0)
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
                  setRotaSelecionada(rota);

                  if (rota.rotaBaseId) {
                    setRotaBaseId(Number(rota.rotaBaseId));
                    const vinculados = await getCaminhaoRota(Number(rota.rotaBaseId));
                    setCaminhoesJaVinculados(vinculados);
                  } else {
                    setRotaBaseId(null);
                    setCaminhoesJaVinculados([]);
                  }
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

          <AssociarCaminhaoForm
            rotaSelecionada={rotaSelecionada || undefined}
            caminhoesDisponiveis={caminhoesDisponiveis}
            parametrosGlobais={parametrosGlobais}
            onSolicitarFechamento={(dados) => {
              setDadosParaVincular(dados);
              setOpenDialogConfirm(true);
            }}
            onVincular={async () => {
            }}
          />

          {caminhoesJaVinculados.length > 0 && (
            <>
              <p className="font-semibold text-sm mb-2 mt-4">Caminhões já vinculados (salvos)</p>
              <ul className="space-y-1">
                <CaminhoesVinculadosList
                  caminhoes={caminhoesJaVinculados}
                  onRemover={removerCaminhao}
                />
              </ul>
            </>
          )}
        </DialogContent>

      </Dialog>

      <DialogConfirm
        openDialogConfirm={openDialogConfirm}
        setOpenDialogConfirm={(open: boolean) => {
          setOpenDialogConfirm(open);
          if (!open) {
            setDadosParaVincular(null);
          }
        }}
        confirmarFechamento={async () => {
          if (dadosParaVincular) {
            await salvarVinculo(dadosParaVincular.kmTotal, dadosParaVincular.diasViagem, dadosParaVincular.caminhoes);
            setOpenDialogConfirm(false);
            setDadosParaVincular(null);
            setRotaSelecionada(null);
          }
        }}
      />
    </>
  );
}
