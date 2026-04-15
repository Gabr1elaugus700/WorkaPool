/**
 * Utilitários de permissões para o módulo de cargas
 * Centraliza toda lógica de controle de acesso baseada em roles
 */

import { UserRole } from "../types/roles.types";

/**
 * Verifica se o usuário pode visualizar os detalhes completos de um pedido
 * Regras:
 * - VENDAS: apenas seus próprios pedidos (mesmo codRep)
 * - Outros roles: todos os pedidos
 */
export function canViewPedido(
  userRole: UserRole | undefined,
  userCodRep: number | undefined,
  pedidoCodRep: number | undefined
): boolean {
  if (!userRole) return false;

  // VENDAS vê apenas seus pedidos
  if (userRole === "VENDAS") {
    return userCodRep === pedidoCodRep;
  }

  // Outros roles veem todos os pedidos
  return ["ADMIN", "LOGISTICA", "ALMOX", "GERENTE_DPTO"].includes(userRole);
}

/**
 * Verifica se o usuário pode mover um pedido entre cargas
 * Regras:
 * - LOGISTICA: pode mover qualquer pedido
 * - VENDAS: apenas seus próprios pedidos (mesmo codRep)
 * - Outros roles: não podem mover
 */
export function canMovePedido(
  userRole: UserRole | undefined,
  userCodRep: number | undefined,
  pedidoCodRep: number | undefined
): boolean {
  if (!userRole) return false;

  // LOGISTICA pode mover qualquer pedido
  if (userRole === "LOGISTICA") {
    return true;
  }

  // VENDAS pode mover apenas seus pedidos
  if (userRole === "VENDAS") {
    return userCodRep === pedidoCodRep;
  }

  return false;
}

/**
 * Verifica se o usuário pode editar cargas (alterar destino, peso máximo, situação, etc)
 * Apenas ADMIN e LOGISTICA podem editar
 */
export function canEditCarga(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  return ["ADMIN", "LOGISTICA"].includes(userRole);
}

/**
 * Verifica se o usuário pode criar novas cargas
 * Apenas ADMIN e LOGISTICA podem criar
 */
export function canCreateCarga(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  return ["ADMIN", "LOGISTICA"].includes(userRole);
}

/**
 * Determina o modo de visualização do pedido
 * 'full': mostra todos os detalhes (cliente, produtos, etc)
 * 'summary': mostra apenas resumo (vendedor, peso, cidade)
 */
export function getPedidoViewMode(
  userRole: UserRole | undefined,
  userCodRep: number | undefined,
  pedidoCodRep: number | undefined
): "full" | "summary" {
  return canViewPedido(userRole, userCodRep, pedidoCodRep) ? "full" : "summary";
}
