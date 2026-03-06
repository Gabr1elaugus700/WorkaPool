import { useCallback, useEffect, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";

import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";

import { Carga, CargaSituacao, Pedido, CargaComPesoDTO } from "../types/cargo.types";
import { cargoService } from "../services/cargoService";

import {
  PedidoCard,
  PedidoDropzone,
  CargaDropzone,
  NovaCargaModal,
  CargasFechadas,
  FiltroCarga
} from "../components";

/**
 * Agrupa pedidos por carga e calcula peso de pedidos visíveis
 */
function agruparPedidosPorCarga(
  pedidosTodos: Pedido[],
  cargasComPesoTotal: CargaComPesoDTO[]
): { pedidosSoltos: Pedido[]; cargasComPedidos: Carga[] } {

  // Separa pedidos sem carga
  const pedidosSoltos = pedidosTodos.filter(p => !p.codCar || p.codCar ===  0);

  // Agrupa pedidos COM carga
  const pedidosPorCarga = new Map<number, Pedido[]>();
  pedidosTodos
    .filter(p => p.codCar && p.codCar > 0)
    .forEach(pedido => {
      const codCar = pedido.codCar!;
      if (!pedidosPorCarga.has(codCar)) {
        pedidosPorCarga.set(codCar, []);
      }
      pedidosPorCarga.get(codCar)!.push(pedido);
    });

  // Monta cargas com pedidos vinculados
  const cargasComPedidos: Carga[] = cargasComPesoTotal.map(cargaDTO => {
    const pedidosDaCarga = pedidosPorCarga.get(cargaDTO.codCar) || [];
    
    return {
      id: cargaDTO.id,
      codCar: cargaDTO.codCar,
      destino: cargaDTO.destino,
      pesoMaximo: cargaDTO.pesoMaximo,
      pesoAtual: cargaDTO.pesoAtual, // Peso TOTAL (backend calculou com TODOS os pedidos)
      previsaoSaida: cargaDTO.previsaoSaida,
      situacao: cargaDTO.situacao as CargaSituacao,
      createdAt: cargaDTO.createdAt,
      closedAt: cargaDTO.closedAt,
      pedidos: pedidosDaCarga, // Apenas pedidos VISÍVEIS para o usuário
    };
  });

  return { pedidosSoltos, cargasComPedidos };
}

export default function ControleDeCargas() {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinosFiltrados, setDestinosFiltrados] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    if (!user?.codRep) return;

    try {
      // Buscar cargas e pedidos EM PARALELO
      const [cargasDTO, todosPedidos] = await Promise.all([
        cargoService.getCargas(
          user.role === "VENDEDOR" || user.role === "LOGISTICA"
            ? ["ABERTA", "SOLICITADA"]
            : undefined
        ),
        cargoService.getTodosPedidosFechados(user.codRep === 999 ? undefined : user.codRep),
      ]);

      // Agrupar pedidos por carga
      const { pedidosSoltos, cargasComPedidos } = agruparPedidosPorCarga(
        todosPedidos,
        cargasDTO
      );

      setPedidos(pedidosSoltos);
      setCargas(cargasComPedidos);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [user?.codRep, user?.role]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const pedido = event.active.data.current?.pedido as Pedido | undefined;
    const destinoId = event.over?.id?.toString();

    if (!pedido || !destinoId) return;
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    const isLogistica = user.role === "LOGISTICA";
    const isVendas = user.role === "VENDAS" && pedido.codRep === user.codRep;

    if (!isLogistica && !isVendas) {
      toast.error("Você não tem permissão para mover esse Pedido");
      return;
    }

    if (destinoId === "pedidos") {
      if (!pedido.codCar || pedido.codCar === 0) {
        toast.error("Esse pedido já está fora de uma carga.");
        return;
      }

      try {
        await cargoService.updatePedidoCarga(Number(pedido.numPed), 0, 0);
        await carregar();
        toast.success("Pedido removido da carga");
      } catch (err) {
        toast.error("Erro ao remover pedido da carga");
        console.error(err);
      }

      return;
    }

    const cargaDestino = cargas.find((c) => c.id === destinoId);
    if (!cargaDestino) return;

    if (pedido.codCar === cargaDestino.codCar) {
      return toast.error("Pedido já está na carga selecionada.");
    }

    // Valida peso máximo (usando peso REAL da carga + peso do novo pedido)
    const novoPeso = cargaDestino.pesoAtual + pedido.peso;
    if (novoPeso > cargaDestino.pesoMaximo) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMaximo}kg!`);
      return;
    }

    const novaPos = cargaDestino.pedidos.length + 1;

    try {
      await cargoService.updatePedidoCarga(
        Number(pedido.numPed),
        cargaDestino.codCar,
        novaPos
      );
      await carregar();
      toast.success("Pedido movido com sucesso");
    } catch (err) {
      toast.error("Erro ao mover pedido para carga");
      console.error(err);
    }
  };

  const cargasFiltradas = cargas.filter((carga) => {
    if (!user) return false;

    if (user.role === "VENDAS") {
      return carga.situacao === CargaSituacao.ABERTA ||
             (carga.pedidos && carga.pedidos.some(p => p.codRep === user.codRep));
    }
    if (user.role === "LOGISTICA") {
      return (
        carga.situacao === CargaSituacao.ABERTA ||
        carga.situacao === CargaSituacao.SOLICITADA
      );
    }
    
    if (destinosFiltrados.length === 0) {
      return true;
    }
    
    return destinosFiltrados.includes(carga.destino);
  });

  const handleChangeSituacao = async (id: string, novaSituacao: CargaSituacao) => {
    setCargas((prev) =>
      prev.map((carga) =>
        carga.id === id ? { ...carga, situacao: novaSituacao } : carga
      )
    );

    try {
      await cargoService.updateSituacaoCarga(id, novaSituacao);

      if (novaSituacao === CargaSituacao.FECHADA) {
        const cargaFechada = cargas.find(carga => carga.id === id);

        if (cargaFechada && cargaFechada.pedidos && cargaFechada.pedidos.length > 0) {
          const numerosPedidos = cargaFechada.pedidos.map(pedido => Number(pedido.numPed));

          try {
            await cargoService.salvarPedidosCargaFechada(id, numerosPedidos);
            toast.success("Carga fechada com sucesso");
          } catch (error) {
            console.error("Erro ao salvar pedidos da carga fechada:", error);
            toast.error("Erro ao salvar pedidos da carga fechada");
          }
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar situação da carga:", error);
      toast.error("Erro ao atualizar situação da carga");
    }
  };

   return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-6 p-6">

          <div className="col-span-2">
            {loading ? (
              <div className="text-center text-lg text-muted-foreground">
                Carregando pedidos...
              </div>
            ) : (
              user?.role !== "ALMOX" && (
                <PedidoDropzone>
                  {pedidos.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      produtos={pedido.produtos || []}
                    />
                  ))}
                </PedidoDropzone>
              )
            )}
          </div>

          <div className="col-span-3 bg-muted p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center h-14 mb-4 px-2">
              <h1 className="text-2xl font-bold text-foreground">
                Cargas
                {destinosFiltrados.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({destinosFiltrados.join(", ")})
                  </span>
                )}
              </h1>
              
              <div className="flex items-center gap-2">
                <FiltroCarga
                  cargas={cargas}
                  onFiltroChange={(destinos) => {
                    setDestinosFiltrados(destinos);
                  }}
                />
                
                {user?.role && ["LOGISTICA", "ADMIN"].includes(user.role) && (
                  <CargasFechadas />
                )}

                <NovaCargaModal
                  onCreated={(nova) =>
                    setCargas((prev): Carga[] => [
                      ...prev,
                      {
                        id: nova.id,
                        codCar: nova.codCar,
                        destino: nova.destino,
                        pesoMaximo: nova.pesoMaximo,
                        pesoAtual: nova.pesoAtual || 0,
                        previsaoSaida: nova.previsaoSaida,
                        situacao: nova.situacao as CargaSituacao,
                        createdAt: nova.createdAt,
                        closedAt: nova.closedAt,
                        pedidos: [],
                      },
                    ])
                  }
                />
              </div>
            </div>

            {cargasFiltradas
              .sort((a, b) => {
                const prioridade = ["SOLICITADA", "ABERTA"];
                const indexA = prioridade.indexOf(a.situacao);
                const indexB = prioridade.indexOf(b.situacao);

                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;

                return a.situacao.localeCompare(b.situacao);
              })
              .map((carga) => (
                <CargaDropzone
                  key={carga.id}
                  carga={carga}
                  onChangeSituacao={handleChangeSituacao}
                  onUpdate={(cargaAtualizada: Carga) => {
                    setCargas((prev) =>
                      prev.map((c) =>
                        c.id === cargaAtualizada.id ? cargaAtualizada : c
                      )
                    );
                  }}
                >
                  {carga.pedidos
                    .slice()
                    .sort((a, b) => (a.poscar ?? 0) - (b.poscar ?? 0))
                    .map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        produtos={pedido.produtos || []}
                        destaque={user?.codRep !== pedido.codRep}
                      />
                    ))}
                </CargaDropzone>
              ))}
          </div>
        </div>
      </DndContext>
    </DefaultLayout>
  );
}
