import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

import DefaultLayout from '@/layout/DefaultLayout';
import { useAuth } from '@/auth/AuthContext';
import PedidoCard from '@/components/PedidoCard';
import PedidoDropzone from '@/components/PedidoDropzone';
import CargaDropzone from '@/components/CargaDropzone';

import { Pedido, Carga } from '@/types/cargas';
import { fetchPedidosFechados, PedidoAgrupado } from '@/services/usePedidosFechados';
import { NovaCargaModal } from '@/components/NovaCargaModal';
import { fetchCargasAbertas } from '@/services/useCargasAbertas';
import { fetchPedidosCargas } from '@/services/usePedidosCarga';

export default function ControleDeCargas() {
  const { user } = useAuth();

  const [pedidosResumo, setPedidosResumo] = useState<PedidoAgrupado[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.codRep) return;

    // const testarFetchDireto = async () => {
    //   try {
    //     const res = await fetch(`http://localhost:3001/api/pedidos?codCar=3`);
    //     const data = await res.json();

    //     console.log('🔍 TESTE FETCH DIRETO - CARGA 3');
    //     console.table(data); // Veja se os campos estão presentes: NUM_PED, CODCAR, etc.
    //   } catch (err) {
    //     console.error('❌ Erro no fetch direto:', err);
    //   }
    // };

    // testarFetchDireto();


    const carregar = async () => {
      try {
        const data = await fetchPedidosFechados(user.codRep);
        setPedidosResumo(data);

        const convertidos = data.map(p => ({
          id: p.numPed,
          numPed: p.numPed,
          cliente: p.cliente,
          cidade: p.cidade,
          peso: p.pesoTotal,
          vendedor: p.vendedor,
          precoFrete: 0,
          codCar: p.codCar ?? null,
        }));

        setPedidos(convertidos);

        const cargasBase = await fetchCargasAbertas();

        const cargasComPedidos = await Promise.all(
          cargasBase.map(async (carga) => {
            const todosPedidos = await fetchPedidosCargas(carga.codCar);

            console.log(`🧪 CARGA ${carga.codCar} => pedidos retornados:`);
            console.table(todosPedidos.map(p => ({
              numPed: p.numPed,
              codCar: p.codCar,
            })));

            // 🔁 Garante que pedidos vinculados à carga também entrem no resumo
            setPedidosResumo((prev) => {
              const novos = todosPedidos.map((p) => ({
                numPed: p.numPed,
                cliente: p.cliente,
                cidade: p.cidade,
                vendedor: p.vendedor,
                produtos: [], // pode melhorar depois com fetch de produtos
                pesoTotal: p.peso,
                codCar: p.codCar,
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
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [user]);


  const handleDragEnd = (event: DragEndEvent) => {
    const pedido = event.active.data.current?.pedido as Pedido;
    const destinoId = event.over?.id?.toString();

    if (!pedido || !destinoId) return;

    const isInPedidos = pedidos.some((p) => p.id === pedido.id);

    if (destinoId === 'pedidos' && isInPedidos) return;

    if (destinoId !== 'pedidos') {
      const cargaAtual = cargas.find((c) =>
        c.pedidos.some((p) => p.id === pedido.id)
      );
      if (cargaAtual?.id === destinoId) return;
    }

    if (destinoId === 'pedidos') {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === pedido.id)) return prev;
        return [...prev, pedido];
      });

      setCargas((prev) =>
        prev.map((c) => ({
          ...c,
          pedidos: c.pedidos.filter((p) => p.id !== pedido.id),
          pesoAtual: c.pedidos.some((p) => p.id === pedido.id)
            ? c.pesoAtual - pedido.peso
            : c.pesoAtual,
        }))
      );
      return;
    }

    const cargaDestino = cargas.find((c) => c.id === destinoId);
    if (!cargaDestino) return;

    const novoPeso = cargaDestino.pesoAtual + pedido.peso;
    if (novoPeso > cargaDestino.pesoMax) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMax}kg!`);
      return;
    }

    setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));

    setCargas((prev) =>
      prev.map((c) =>
        c.id === destinoId
          ? {
            ...c,
            pedidos: [...c.pedidos, pedido],
            pesoAtual: c.pesoAtual + pedido.peso,
          }
          : {
            ...c,
            pedidos: c.pedidos.filter((p) => p.id !== pedido.id),
            pesoAtual: c.pedidos.some((p) => p.id === pedido.id)
              ? c.pesoAtual - pedido.peso
              : c.pesoAtual,
          }
      )
    );
  };

  return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6 p-6">
          {loading ? (
            <div className="text-center col-span-3 text-xl">Carregando pedidos...</div>
          ) : (
            <PedidoDropzone>
              {pedidos.map((pedido) => {
                const resumo = pedidosResumo.find(p => p.numPed === pedido.numPed);
                return (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    produtos={resumo?.produtos || []}
                  />
                );
              })}
            </PedidoDropzone>
          )}

          <div className="col-span-2 bg-gray-400 p-6 rounded shadow-md">
            <div className="px-6 mt-4 flex justify-between items-center">
              <h1 className="text-3xl font-bold mb-4">Cargas</h1>
              <NovaCargaModal
                onCreated={(nova) =>
                  setCargas((prev): Carga[] => [
                    ...prev,
                    {
                      ...nova,
                      custoMinimo: nova.custoMin,
                      pedidos: [],
                      pesoAtual: 0,
                    },
                  ])
                }
              />
            </div>

            {cargas.map((carga) => (
              <CargaDropzone key={carga.id} carga={carga}>
                {carga.pedidos.map((pedido) => {
                  // console.log('carga.codCar:', carga.codCar, 'pedido.codCar:', pedido.codCar);

                  const resumo = pedidosResumo.find(p => p.numPed === String(pedido.numPed));
                  console.log('🧩 Pedido:', pedido.numPed, 'Resumo:', resumo);
                  return (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      produtos={resumo?.produtos || []}
                    />
                  );
                })}
              </CargaDropzone>
            ))}

          </div>
        </div>
      </DndContext>
    </DefaultLayout>
  );
}
