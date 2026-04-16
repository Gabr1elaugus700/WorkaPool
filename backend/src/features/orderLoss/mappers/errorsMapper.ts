const erroMap: Record<string, { status: number, message: string, method?: string }> = {
  ORDER_NOT_FOUND: { status: 404, message: "Pedido não encontrado", method: "PUT" },
  ORDER_NOT_LOST: { status: 409, message: "Pedido não está em estado LOST", method: "PUT" },
  LOSS_REASON_NOT_FOUND: { status: 404, message: "Justificativa não encontrada", method: "PUT" },
  LOSS_REASON_EXPIRED: { status: 403, message: "Justificativa expirada e não pode ser alterada", method: "PUT" },
};

export const errorsMapper = (error: string) => {
  return erroMap[error] || { status: 500, message: "Erro ao processar a requisição", method: "PUT" };
};