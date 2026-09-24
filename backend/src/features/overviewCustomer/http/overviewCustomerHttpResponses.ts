import type { Response } from "express";
import { AppError } from "../../../utils/AppError";

export function parseOverviewCustomerCode(
  rawClienteId: string | undefined,
): number | null {
  const customerCode = Number(rawClienteId);
  return Number.isInteger(customerCode) && customerCode > 0 ? customerCode : null;
}

export function sendInvalidOverviewCustomerId(res: Response): Response {
  return res.status(400).json({
    error: "clienteId inválido",
    code: "OVERVIEW_CUSTOMER_INVALID_ID",
  });
}

export function sendOverviewCustomerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  return res.status(500).json({
    error: fallbackMessage,
    code: "INTERNAL_ERROR",
  });
}
