function formatRoleList(roles: readonly string[]): string {
  if (roles.length === 1) {
    return roles[0];
  }
  if (roles.length === 2) {
    return `${roles[0]} e ${roles[1]}`;
  }
  const last = roles[roles.length - 1];
  return `${roles.slice(0, -1).join(", ")} e ${last}`;
}

export function formatIbcAccessDeniedText(
  roles: readonly string[],
  targetPhrase: string,
): string {
  const verb = roles.length === 1 ? "pode" : "podem";
  return `Apenas ${formatRoleList(roles)} ${verb} acessar ${targetPhrase}.`;
}
