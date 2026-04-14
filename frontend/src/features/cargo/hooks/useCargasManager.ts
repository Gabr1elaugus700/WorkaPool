import { useCallback, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { Carga, CargaSituacao, Pedido, CargaComPesoDTO } from "../types/cargo.types";
import { cargoService } from "../services/cargoService";
import { canMovePedido } from "../utils/permissions";
import { UserRole } from "../types/roles.types";

/**
 * Agrupa pedidos por carga e calcula peso de pedidos visíveis
 */
function agruparPedidosPorCarga(
  pedidosTodos: Pedido[],
  cargasComPesoTotal: CargaComPesoDTO[]
): { pedidosSoltos: Pedido[]; cargasComPedidos: Carga[] } {
  // Separa pedidos sem carga
  const pedidosSoltos = pedidosTodos.filter((p) => !p.codCar || p.codCar === 0);

  // Agrupa pedidos COM carga
  const pedidosPorCarga = new Map<number, Pedido[]>();
  pedidosTodos
    .filter((p) => p.codCar && p.codCar > 0)
    .forEach((pedido) => {
      const codCar = pedido.codCar!;
      if (!pedidosPorCarga.has(codCar)) {
        pedidosPorCarga.set(codCar, []);
      }
      pedidosPorCarga.get(codCar)!.push(pedido);
    });

  // Monta cargas com pedidos vinculados
  const cargasComPedidos: Carga[] = cargasComPesoTotal.map((cargaDTO) => {
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

export function useCargasManager(
  userRole: UserRole | undefined,
  userCodRep: number | undefined
) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinosFiltrados, setDestinosFiltrados] = useState<string[]>([]);

  /**
   * Carrega dados de pedidos e cargas do backend
   */
  const carregar = useCallback(async () => {
    if (!userCodRep) return;

    try {
      // Buscar cargas e pedidos EM PARALELO
      const [cargasDTO, todosPedidos] = await Promise.all([
        cargoService.getCargas(
          userRole === "VENDAS" || userRole === "LOGISTICA"
            ? ["ABERTA", "SOLICITADA"]
            : undefined
        ),
        // Buscar TODOS os pedidos para poder mostrar pedidos de outros vendedores nas cargas
        cargoService.getTodosPedidosFechados(undefined),
      ]);

      // Agrupar TODOS os pedidos por carga primeiro
      const { pedidosSoltos: todosPedidosSoltos, cargasComPedidos } = agruparPedidosPorCarga(
        todosPedidos,
        cargasDTO
      );

      // Para VENDAS: filtrar apenas seus pedidos SOLTOS
      // Pedidos dentro das cargas permanecem todos (serão filtrados visualmente no componente)
      const pedidosSoltosFiltrados =
        userRole === "VENDAS"
          ? todosPedidosSoltos.filter((p) => p.codRep === userCodRep)
          : todosPedidosSoltos;

      setPedidos(pedidosSoltosFiltrados);
      setCargas(cargasComPedidos);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [userCodRep, userRole]);

  /**
   * Manipula o fim do drag-and-drop
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const pedido = event.active.data.current?.pedido as Pedido | undefined;
      const destinoId = event.over?.id?.toString();

      if (!pedido || !destinoId) return;

      // Verifica permissão para mover o pedido
      if (!canMovePedido(userRole, userCodRep, pedido.codRep)) {
        toast.error("Você não tem permissão para mover esse Pedido");
        return;
      }

      // Caso 1: Mover para área de pedidos (remover da carga)
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

      // Caso 2: Mover para uma carga
      const cargaDestino = cargas.find((c) => c.id === destinoId);
      if (!cargaDestino) return;

      if (pedido.codCar === cargaDestino.codCar) {
        return toast.error("Pedido já está na carga selecionada.");
      }

      // Valida peso máximo (usando peso REAL da carga + peso do novo pedido)
      const novoPeso = cargaDestino.pesoAtual + pedido.peso;
      if (novoPeso > cargaDestino.pesoMaximo) {
        toast.error(
          `Carga excede o peso máximo de ${cargaDestino.pesoMaximo}kg!`
        );
        return;
      }

      const novaPos = cargaDestino.pedidos.length + 1;

      try {
        console.log("🔄 Movendo pedido:", {
          numPed: Number(pedido.numPed),
          codCar: cargaDestino.codCar,
          novaPos,
        });

        await cargoService.updatePedidoCarga(
          Number(pedido.numPed),
          cargaDestino.codCar,
          novaPos
        );

        console.log("✅ Pedido movido, recarregando dados...");
        await carregar();
        toast.success("Pedido movido com sucesso");
      } catch (err) {
        console.error("❌ Erro completo:", err);
        toast.error("Erro ao mover pedido para carga");
      }
    },
    [cargas, carregar, userCodRep, userRole]
  );

  /**
   * Altera situação de uma carga
   */
  const handleChangeSituacao = useCallback(
    async (id: string, novaSituacao: CargaSituacao) => {
      console.log(`🔵 [useCargasManager] handleChangeSituacao chamado:`, { id, novaSituacao });

      try {
        // Se a situação for FECHADA, usa o fluxo especial de fechamento
        if (novaSituacao === CargaSituacao.FECHADA) {
          const cargaFechada = cargas.find((carga) => carga.id === id);
          console.log(`🔍 [useCargasManager] Carga a fechar:`, cargaFechada);

          if (!cargaFechada || !cargaFechada.codCar) {
            toast.error("Carga não encontrada ou sem código válido");
            return;
          }

          console.log(`📤 [useCargasManager] Chamando closeCarga com codCar: ${cargaFechada.codCar}`);

          try {
            // closeCarga já atualiza a situação + salva pedidos
            const resultado = await cargoService.closeCarga(cargaFechada.codCar);
            console.log(`✅ [useCargasManager] Resultado:`, resultado);
            
            toast.success(`Carga fechada com sucesso! ${resultado.pedidosSalvos} pedidos salvos.`);
            
            // Recarregar dados para refletir mudanças
            await carregar();
          } catch (error) {
            console.error("❌ [useCargasManager] Erro ao fechar carga:", error);
            toast.error(`Erro ao fechar carga: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        } else {
          const cargaAlvo = cargas.find((c) => c.id === id);
          if (cargaAlvo == null || cargaAlvo.codCar == null) {
            toast.error("Carga não encontrada ou sem código válido");
            return;
          }

          setCargas((prev) =>
            prev.map((carga) =>
              carga.id === id ? { ...carga, situacao: novaSituacao } : carga,
            ),
          );

          await cargoService.updateSituacaoCarga(cargaAlvo.codCar, novaSituacao);
          toast.success("Situação da carga atualizada com sucesso");
        }
      } catch (error) {
        console.error("❌ [useCargasManager] Erro ao atualizar situação:", error);
        toast.error("Erro ao atualizar situação da carga");
      }
    },
    [cargas, carregar]
  );

  /**
   * Filtra cargas baseado no role e destinos selecionados
   */
  const cargasFiltradas = cargas.filter((carga) => {
    // Filtro por role
    let passaFiltroRole = true;
    
    if (userRole === "VENDAS") {
      passaFiltroRole = (
        carga.situacao === CargaSituacao.ABERTA ||
        (carga.pedidos && carga.pedidos.some((p) => p.codRep === userCodRep))
      );
    } else if (userRole === "LOGISTICA") {
      passaFiltroRole = (
        carga.situacao === CargaSituacao.ABERTA ||
        carga.situacao === CargaSituacao.SOLICITADA
      );
    }

    if (!passaFiltroRole) {
      return false;
    }

    // Filtro por destino
    if (destinosFiltrados.length === 0) {
      return true;
    }

    return destinosFiltrados.includes(carga.destino);
  });

  return {
    pedidos,
    cargas,
    loading,
    destinosFiltrados,
    setDestinosFiltrados,
    carregar,
    handleDragEnd,
    handleChangeSituacao,
    cargasFiltradas,
    setCargas,
  };
}
