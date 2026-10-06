import { AppError } from "../../../utils/AppError";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";

export async function assertIbcChecklistItensElegiveis(
  itemRepository: IIbcChecklistItemRepository,
  itensIds: string[],
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

  const inativos = itensIds.filter((id) => !porId.get(id)?.ativo);
  if (inativos.length > 0) {
    throw new AppError({
      message: "Item de checklist inativo não pode ser adicionado",
      statusCode: 422,
      code: "IBC_CHECKLIST_ITEM_INATIVO",
      details: { itensIds: inativos },
    });
  }
}
