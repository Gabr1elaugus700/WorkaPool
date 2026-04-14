/**
 * Chave canônica para comparar número do pedido local (Prisma `orderNumber`)
 * com `NUMPED` do Sapiens (string ou número em JSON).
 */
export function normalizeOrderNumberKey(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const n = Number(trimmed);
  if (Number.isFinite(n)) return String(Math.trunc(n));
  return trimmed;
}
