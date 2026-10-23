export type IbcCompatibilidade = {
  identificador: string;
  universal: boolean;
  grupoCodigo: string | null;
};

/** Legado sem produto: `HM` e exatamente 4 dígitos, sem sigla. */
const LEGADO_SEM_PRODUTO = /^HM\d{4}$/;

/**
 * Compatível se o container é universal ou se o grupo dele está em `grupos`.
 * `HM####` nunca é compatível, até converter para NH.
 */
export function isIbcCompativelComGrupos(
  ibc: IbcCompatibilidade,
  grupos: readonly string[],
): boolean {
  if (LEGADO_SEM_PRODUTO.test(ibc.identificador.trim().toUpperCase())) return false;
  if (ibc.universal) return true;
  const grupo = ibc.grupoCodigo?.trim() ?? "";
  return grupo.length > 0 && grupos.includes(grupo);
}
