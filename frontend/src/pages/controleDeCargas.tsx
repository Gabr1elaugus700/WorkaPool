import { useCallback, useEffect, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";

import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import PedidoCard from "@/components/cargas/PedidoCard";
import PedidoDropzone from "@/components/cargas/PedidoDropzone";
import CargaDropzone from "@/components/cargas/CargaDropzone";

import { Pedido, Carga } from "@/types/cargas";
import { fetchPedidosFechados } from "@/services/usePedidosFechados";
import { NovaCargaModal } from "@/components/cargas/NovaCargaModal";
import { fetchCargas } from "@/services/useCargas";
import { fetchPedidosCargas } from "@/services/usePedidosCarga";
import { fetchPedidoToCarga } from "@/services/usePedidoToCarga";
import { fetchUpdateSitCar } from "@/services/useUpdateSitCar";
import { salvarPedidosCargaFechada } from "@/services/useCargaPedidos";
import CargasFechadas from "@/components/cargas/CargasFechadas";
import { FiltroCarga } from "@/components/cargas/FiltroCargas";

export default function ControleDeCargas() {
  const { user } = useAuth();

  const [, setPedidosResumo] = useState<Pedido[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinosFiltrados, setDestinosFiltrados] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    if (!user?.codRep) return;

    try {
      const data = await fetchPedidosFechados(user.codRep);
      setPedidosResumo(data);

      const convertidos = data.map((p) => ({
        id: p.numPed,
        numPed: p.numPed,
        cliente: p.cliente,
        cidade: p.cidade,
        peso: p.peso,
        vendedor: p.vendedor,
        codRep: p.codRep ?? null,
        bloqueado: p.bloqueado,
        precoFrete: 0,
        codCar: p.codCar ?? null,
        sitCar: p.sitCar ?? null,
        posCar: p.posCar ?? null,
        produtos: p.produtos ?? [],
      }));

      setPedidos(convertidos);

      const cargasBase = await fetchCargas();

      const cargasComPedidos = await Promise.all(
        cargasBase.map(async (carga) => {
          const todosPedidos = await fetchPedidosCargas(carga.codCar);

          setPedidosResumo((prev) => {
            const novos = todosPedidos.map((p) => ({
              id: p.numPed,
              numPed: p.numPed,
              cliente: p.cliente,
              cidade: p.cidade,
              vendedor: p.vendedor,
              codRep: p.codRep ?? null,
              bloqueado: p.bloqueado,
              produtos: p.produtos ?? [],
              peso: p.peso,
              precoFrete: 0,
              codCar: p.codCar,
              sitCar: p.sitCar,
              posCar: p.posCar,
            }));

            const combinados = [...prev];
            novos.forEach((novo) => {
              if (!combinados.some((r) => r.numPed === novo.numPed)) {
                combinados.push(novo);
              }
            });

            return combinados;
          });

          const pedidosFiltrados = todosPedidos.filter(
            (pedido) => Number(pedido.codCar) === Number(carga.codCar)
          );

          return {
            ...carga,
            pedidos: pedidosFiltrados,
            pesoAtual: pedidosFiltrados.reduce((soma, p) => soma + p.peso, 0),
          };
        })
      );

      setCargas(cargasComPedidos);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.codRep]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const pedido = event.active.data.current?.pedido as Pedido;
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
        await fetchPedidoToCarga(Number(pedido.numPed), 0, 0);
        await carregar();
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

    const novoPeso = cargaDestino.pesoAtual + pedido.peso;
    if (novoPeso > cargaDestino.pesoMax) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMax}kg!`);
      return;
    }

    const novaPos = cargaDestino.pedidos.length + 1;

    try {
      await fetchPedidoToCarga(Number(pedido.numPed), cargaDestino.codCar, novaPos);
      await carregar();
    } catch (err) {
      toast.error("Erro ao mover pedido para carga");
      console.error(err);
    }
  };

  const cargasFiltradas = cargas.filter((carga) => {
    // Aplica filtro de permissão do usuário
    if (!user) return false;

    if (user.role === "VENDAS") {
      return carga.situacao === "ABERTA";
    }
    if (user.role === "LOGISTICA") {
      return (
        carga.situacao === "ABERTA" ||
        carga.situacao === "SOLICITADA"
      );
    }
    
    // Se nenhum destino está selecionado, mostra todas as cargas
    if (destinosFiltrados.length === 0) {
      return true;
    }
    
    // Se há filtros aplicados, mostra apenas as cargas dos destinos selecionados
    return destinosFiltrados.includes(carga.destino);
  });

  const handleChangeSituacao = async (id: string, novaSituacao: string) => {
    console.log("Atualizando situação da carga:", id, novaSituacao);

    // Atualizar estado local
    setCargas((prev) =>
      prev.map((carga) =>
        carga.id === id ? { ...carga, situacao: novaSituacao } : carga
      )
    );

    try {
      // Primeiro atualiza a situação da carga no banco de dados
      await fetchUpdateSitCar(id, novaSituacao);

      // Depois verifica se a situação é FECHADA
      if (novaSituacao === "FECHADA") {
        // Encontra a carga que foi alterada
        const cargaFechada = cargas.find(carga => carga.id === id);

        // Se encontrou a carga e ela tem pedidos
        if (cargaFechada && cargaFechada.pedidos && cargaFechada.pedidos.length > 0) {
          // Extrai apenas os números dos pedidos
          const numerosPedidos = cargaFechada.pedidos.map(pedido => Number(pedido.numPed));

          console.log("Salvando pedidos da carga fechada:", id, numerosPedidos);

          try {
            // Chama o serviço para salvar os pedidos
            await salvarPedidosCargaFechada(id, numerosPedidos);
            toast.success("Pedidos da carga fechada salvos com sucesso");
          } catch (error) {
            console.error("Erro ao salvar pedidos da carga fechada:", error);
            toast.error("Erro ao salvar pedidos da carga fechada");
          }
        } else {
          console.log("Carga sem pedidos para salvar:", cargaFechada);
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

          {/* Coluna dos pedidos */}
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

          {/* Coluna das cargas */}
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
                        ...nova,
                        custoMin: nova.custoMin,
                        pedidos: [],
                        pesoAtual: 0,
                        previsaoSaida: nova.previsaoSaida,
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
                    .sort((a, b) => (a.posCar ?? 0) - (b.posCar ?? 0))
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