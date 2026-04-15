import { z } from "zod";
import { Carga } from "../../entities/Carga";
import { Pedido } from "../../entities/Pedido";

// Enums
export const sitCargoEnum = z.enum(["ABERTA", "FECHADA", "CANCELADA", "SOLICITADA", "ENTREGUE"]);

export const CreateCargaSchema = z.object({
    destino: z.string().min(1, "O destino é obrigatório"),
    pesoMax: z.coerce.number().positive("O peso máximo deve ser um número positivo"),
    previsaoSaida: z.string().refine((date) => !isNaN(Date.parse(date)), "A previsão de saída deve ser uma data válida"),
    situacao: sitCargoEnum.optional(),
});

export type CreateCargaDTO = z.infer<typeof CreateCargaSchema>;

export interface CargaResponseDTO {
  id: string;
  codCar: number;
  destino: string;
  pesoMaximo: number;
  previsaoSaida: string; // ISO string, não Date
  situacao: typeof sitCargoEnum._type;
  createdAt: string;
  closedAt?: string;
}

export function toCargaResponseDTO(carga: Carga): CargaResponseDTO {
  return {
    id: carga.id,
    codCar: carga.codCar,
    destino: carga.destino,
    pesoMaximo: carga.pesoMaximo,
    previsaoSaida: carga.previsaoSaida.toISOString(),
    situacao: carga.situacao,
    createdAt: carga.createdAt.toISOString(),
    closedAt: carga.closedAt?.toISOString(),
  };
}

// DTO extendido com peso total calculado
export interface CargaComPesoDTO extends CargaResponseDTO {
  pesoAtual: number;          // Peso total de TODOS os pedidos da carga
  quantidadePedidos: number;  // Número de pedidos na carga
}

// Converte Carga + array de Pedidos para CargaComPesoDTO
export function toCargaComPesoDTO(
  carga: Carga,
  pedidos: Pedido[]
): CargaComPesoDTO {
  return {
    ...toCargaResponseDTO(carga),
    pesoAtual: pedidos.reduce((sum, p) => sum + p.peso, 0),
    quantidadePedidos: pedidos.length,
  };
}