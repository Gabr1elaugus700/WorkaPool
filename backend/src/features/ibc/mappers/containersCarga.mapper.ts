import type { z } from "zod";
import { containersCargaSchemas } from "../schemas/containersCarga.schemas";
import type { ContainersCarga } from "../useCases/ListContainersCarga.use-case";

export type ContainersCargaResponse = z.infer<typeof containersCargaSchemas.resposta>;

/** O parse descarta campo que não esteja no contrato. */
export function toContainersCargaResponse(result: ContainersCarga): ContainersCargaResponse {
  return containersCargaSchemas.resposta.parse(result);
}
