const EXPRESS_CANNOT_METHOD_RE = /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /i;

function extractPreText(html: string): string | null {
  const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  const text = match?.[1]?.trim();
  return text && text.length > 0 ? text : null;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseApiErrorBody(text: string, status: number): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return fallbackApiErrorMessage(status);
  }

  const preText = extractPreText(trimmed);
  const candidate = preText ?? (/<html|<body|<!doctype/i.test(trimmed) ? stripHtmlToText(trimmed) : trimmed);

  if (!candidate) {
    return fallbackApiErrorMessage(status);
  }

  if (EXPRESS_CANNOT_METHOD_RE.test(candidate)) {
    return fallbackApiErrorMessage(status);
  }

  return candidate;
}

export function fallbackApiErrorMessage(status: number): string {
  if (status === 401) {
    return "Sessão expirada ou não autenticada.";
  }
  if (status === 403) {
    return "Acesso negado.";
  }
  if (status === 404) {
    return "Recurso não encontrado.";
  }
  if (status >= 500) {
    return "Erro no servidor. Tente novamente em instantes.";
  }
  return `Não foi possível completar a requisição (HTTP ${status}).`;
}
