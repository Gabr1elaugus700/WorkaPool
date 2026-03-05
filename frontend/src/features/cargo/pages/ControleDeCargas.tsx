import { useCallback, useEffect, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";

import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";

import { Carga, Pedido } from "../types/cargo.types";
import { 
  fetchCargas, 
  fetchPedidosCargas, 
  updatePedidoCarga,
  updateSituacaoCarga, 
  salvarPedidosCargaFechada 
} from "../services";
import { cargoService } from "../services/cargoService";

import {
  PedidoCard,
  PedidoDropzone,
  CargaDropzone,
  NovaCargaModal,
  CargasFechadas,
  FiltroCarga
} from "../components";

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
      // =====================================
      // 1️⃣ BUSCAR PEDIDOS SEM CARGA (zona de arrastar)
      //    Filtrado por vendedor
      // =====================================
      const pedidosSoltos = await cargoService.getPedidosFechados(user.codRep);
      setPedidos(pedidosSoltos.filter(p => !p.codCar || p.codCar === 0));
      setPedidosResumo(pedidosSoltos);

      // =====================================
      // 2️⃣ BUSCAR CARGAS COM PESO TOTAL REAL
      //    Backend já calcula peso de TODOS os pedidos
      // =====================================
      const cargasBase = await fetchCargas();
      // ✅ cargasBase[x].pesoAtual já considera TODOS os vendedores!

      // =====================================
      // 3️⃣ PARA CADA CARGA: buscar pedidos DO VENDEDOR
      //    Apenas para VISUALIZAÇÃO
      // =====================================
      const cargasComPedidosFiltrados = await Promise.all(
        cargasBase.map(async (carga) => {
          // ✨ Filtrar pedidos por vendedor para exibição
          const pedidosVisiveis = await fetchPedidosCargas(
            carga.codCar,
            user.codRep  // 🔍 Filtra apenas pedidos deste vendedor
          );

          return {
            ...carga,
            pedidos: pedidosVisiveis,  // 👁️ Visualização filtrada
            // pesoAtual: JÁ VEM DO BACKEND (peso real global) - NÃO recalcular
          };
        })
      );

      setCargas(cargasComPedidosFiltrados);
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
        await updatePedidoCarga(Number(pedido.numPed), 0, 0);
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
    if (novoPeso > cargaDestino.pesoMaximo) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMaximo}kg!`);
      return;
    }

    const novaPos = cargaDestino.pedidos.length + 1;

    try {
      await updatePedidoCarga(Number(pedido.numPed), cargaDestino.codCar, novaPos);
      await carregar();
    } catch (err) {
      toast.error("Erro ao mover pedido para carga");
      console.error(err);
    }
  };

  const cargasFiltradas = cargas.filter((carga) => {
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
    
    if (destinosFiltrados.length === 0) {
      return true;
    }
    
    return destinosFiltrados.includes(carga.destino);
  });

  const handleChangeSituacao = async (id: string, novaSituacao: string) => {
    console.log("Atualizando situação da carga:", id, novaSituacao);

    setCargas((prev) =>
      prev.map((carga) =>
        carga.id === id ? { ...carga, situacao: novaSituacao } : carga
      )
    );

    try {
      await updateSituacaoCarga(id, novaSituacao);

      if (novaSituacao === "FECHADA") {
        const cargaFechada = cargas.find(carga => carga.id === id);

        if (cargaFechada && cargaFechada.pedidos && cargaFechada.pedidos.length > 0) {
          const numerosPedidos = cargaFechada.pedidos.map(pedido => Number(pedido.numPed));

          console.log("Salvando pedidos da carga fechada:", id, numerosPedidos);

          try {
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
                        ...nova,
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
