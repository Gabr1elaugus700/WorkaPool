import { AppError } from "../../../utils/AppError";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";

/**
 * Itens desativados só podem permanecer num checklist em que já estavam;
 * nunca entram como novos.
 */
export async function assertIbcChecklistItensElegiveis(
  itemRepository: IIbcChecklistItemRepository,
  itensIds: string[],
  idsJaPresentes: ReadonlySet<string> = new Set(),
): Promise<void> {
  const encontrados = await itemRepository.findManyByIds(itensIds);
  const porId = new Map(encontrados.map((item) => [item.id, item]));

  const inexistentes = itensIds.filter((id) => !porId.has(id));
  if (inexistentes.length > 0) {
    throw new AppError({
      message: "Item de checklist não encontrado",
      statusCode: 404,
      code: "IBC_CHECKLIST_ITEM_NOT_FOUND",
      details: { itensIds: inexistentes },
    });
  }

  const inativos = itensIds.filter((id) => !porId.get(id)?.ativo && !idsJaPresentes.has(id));
  if (inativos.length > 0) {
    throw new AppError({
      message: "Item de checklist inativo não pode ser adicionado",
      statusCode: 422,
      code: "IBC_CHECKLIST_ITEM_INATIVO",
      details: { itensIds: inativos },
    });
  }
}
