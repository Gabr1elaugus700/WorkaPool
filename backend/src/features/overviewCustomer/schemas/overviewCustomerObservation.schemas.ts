import { z } from "zod";

export const OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH = 2000;

export const overviewCustomerObservationParamsSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
});

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

// OpenAPI-only view of the create body: the runtime schema above must stay
// lenient, so the length rule enforced by the use case is documented here.
export const createOverviewCustomerObservationBodyContractSchema = z.object({
  body: z.string().trim().min(1).max(OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH),
});

export const overviewCustomerObservationSchema = z.object({
  id: z.string(),
  customerCode: z.number().int().positive(),
  authorUserId: z.string(),
  authorDisplayName: z.string(),
  body: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  editedAt: z.string().datetime().nullable(),
});

export const overviewCustomerObservationListResponseSchema = z.object({
  items: z.array(overviewCustomerObservationSchema).max(50),
  hasOlder: z.boolean(),
  nextBefore: z
    .object({
      createdAt: z.string().datetime(),
      id: z.string(),
    })
    .nullable(),
});
