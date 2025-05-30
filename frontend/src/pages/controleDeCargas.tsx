import { useCallback, useEffect, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner';

import DefaultLayout from '@/layout/DefaultLayout';
import { useAuth } from '@/auth/AuthContext';
import PedidoCard from '@/components/PedidoCard';
import PedidoDropzone from '@/components/PedidoDropzone';
import CargaDropzone from '@/components/CargaDropzone';

import { Pedido, Carga } from '@/types/cargas';
import { fetchPedidosFechados } from '@/services/usePedidosFechados';
import { NovaCargaModal } from '@/components/NovaCargaModal';
import { fetchCargas } from '@/services/useCargas';
import { fetchPedidosCargas } from '@/services/usePedidosCarga';
import { fetchPedidoToCarga } from '@/services/usePedidoToCarga';
import { fetchUpdateSitCar } from '@/services/useUpdateSitCar';

export default function ControleDeCargas() {
  const { user } = useAuth();

  const [, setPedidosResumo] = useState<Pedido[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user?.codRep) return;
    try {
      const data = await fetchPedidosFechados(user.codRep);
      setPedidosResumo(data);

      const convertidos = data.map(p => ({
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
            console.log('TEste', combinados)
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
  }, [user?.codRep]);

  useEffect(() => {
    carregar();
  }, [carregar]);


  const handleDragEnd = async (event: DragEndEvent) => {
    const pedido = event.active.data.current?.pedido as Pedido;
    const destinoId = event.over?.id?.toString();

    if (!pedido || !destinoId) return;
    if (!user) {
      toast.error('Usuário não autenticado.');
      return;
    }

    const isLogistica = user.role === 'LOGISTICA';
    const isVendas = user.role === 'VENDAS' && pedido.codRep === user.codRep;

    if (!isLogistica && !isVendas) {
      toast.error('Você não tem permissão para mover esse Pedido');
      return;
    }

    // Se for soltar de volta na lista de pedidos
    if (destinoId === 'pedidos') {
      const podeRemover = isLogistica || isVendas;

      if (!podeRemover) {
        toast.error('Você não tem permissão para remover esse pedido da carga.');
        return;
      }

      if (!pedido.codCar || pedido.codCar === 0) {
        toast.error('Esse pedido já está fora de uma carga.');
        return;
      }

      try {
        await fetchPedidoToCarga(Number(pedido.numPed), 0, 0);
        await carregar(); // sincroniza tudo
      } catch (err) {
        toast.error('Erro ao remover pedido da carga');
        console.error(err);
      }

      return;
    }

    // Encontrar carga de destino
    const cargaDestino = cargas.find((c) => c.id === destinoId);
    if (!cargaDestino) return;

    // Evita mover para a mesma carga
    if (pedido.codCar === cargaDestino.codCar) {
      return toast.error('Pedido já está na carga selecionada.');
    }

    // Verifica se peso excede
    const novoPeso = cargaDestino.pesoAtual + pedido.peso;
    if (novoPeso > cargaDestino.pesoMax) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMax}kg!`);
      return;
    }

    const novaPos = cargaDestino.pedidos.length + 1;

    try {
      await fetchPedidoToCarga(Number(pedido.numPed), cargaDestino.codCar, novaPos);
      await carregar(); // sincroniza após mover
    } catch (err) {
      toast.error('Erro ao mover pedido para carga');
      console.error(err);
    }
  };

  const handleChangeSituacao = async (id: string, novaSituacao: string) => {
    setCargas(prev =>
      prev.map(carga =>
        carga.id === id ? { ...carga, situacao: novaSituacao } : carga
      )
    );

    try {
      const data = await fetchUpdateSitCar(id, novaSituacao);
      console.log('atualizado com sucesso: ', data)
    } catch (error) {
      console.error('Erro ao atualizar situação da carga:', error);
    }
  };



  return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-6 p-6 ">
          {loading ? (
            <div className="text-center col-span-3 text-xl">Carregando pedidos...</div>
          ) : (
            <PedidoDropzone>
              {pedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  produtos={pedido.produtos || []}
                />
              ))}
            </PedidoDropzone>
          )}

          <div className="col-span-3 bg-gray-400 p-6 rounded shadow-md">
            <div className="px-6 mt-4 flex justify-between items-center h-14">
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
                      previsaoSaida: nova.previsaoSaida
                    },
                  ])
                }
              />
            </div>

            {cargas
              .filter((carga) => {
                if (!user) return false;

                if (user.role === 'VENDAS') {
                  return carga.situacao === 'ABERTA';
                }

                return true;
              })
              .sort((a, b) => {
                const prioridade = ['SOLICITADA', 'ABERTA'];
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
                >
                  {carga.pedidos
                    .slice()
                    .sort((a, b) => (a.posCar ?? 0) - (b.posCar ?? 0)) // ou a.posPed se for o nome certo
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
