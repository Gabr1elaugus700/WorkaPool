import { z } from "zod";

export const listOverviewCustomerObservationsQuerySchema = z
  .object({
    beforeCreatedAt: z.string().datetime().optional(),
    beforeId: z.string().trim().min(1).optional(),
  })
  .refine(
    (query) =>
      (query.beforeCreatedAt === undefined) === (query.beforeId === undefined),
    {
      message: "beforeCreatedAt e beforeId devem ser enviados juntos",
      path: ["beforeId"],
    },
  );

// Missing/non-string body falls through as "" so the use case checks access
// (403) before rejecting the body (400 OBSERVATION_INVALID_BODY).
export const createOverviewCustomerObservationBodySchema = z.object({
  body: z.string().catch(""),
});
