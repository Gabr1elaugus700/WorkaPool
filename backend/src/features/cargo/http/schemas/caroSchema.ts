import { z } from "zod";

// Enums
export const sitCargoEnum = z.enum(["ABERTA", "FECHADA", "EM_TRANSITO", "ENTREGUE", "CANCELADA"]);

