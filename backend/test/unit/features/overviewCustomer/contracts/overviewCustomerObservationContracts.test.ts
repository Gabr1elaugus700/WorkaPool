import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOpenApiDocument } from "../../../../../src/docs/openapi/buildOpenApi";
import { overviewCustomerContracts } from "../../../../../src/features/overviewCustomer/contracts/overviewCustomer.contracts";
import {
  overviewCustomerObservationListResponseSchema,
  overviewCustomerObservationSchema,
} from "../../../../../src/features/overviewCustomer/schemas/overviewCustomerObservation.schemas";
import type { CreateOverviewCustomerObservationResult } from "../../../../../src/features/overviewCustomer/useCases/CreateOverviewCustomerObservationUseCase";
import type { ListOverviewCustomerObservationsResult } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewCustomerObservationsUseCase";

type OpenApiParameter = { in: string; name: string; required: boolean };
type OpenApiOperation = {
  parameters?: OpenApiParameter[];
  requestBody?: unknown;
  responses: Record<string, { description: string }>;
};

const OBSERVATIONS_PATH = "/api/overview/customers/{clienteId}/observations";

const document = buildOpenApiDocument(overviewCustomerContracts);

function observationOperation(method: "get" | "post"): OpenApiOperation {
  const pathItem = document.paths[OBSERVATIONS_PATH];
  assert.ok(pathItem, `path ${OBSERVATIONS_PATH} ausente do OpenAPI`);
  const operation = pathItem[method];
  assert.ok(operation, `${method.toUpperCase()} ${OBSERVATIONS_PATH} ausente`);
  return operation as OpenApiOperation;
}

describe("overviewCustomer observation contracts", () => {
  it("documents GET observations with cursor query and error statuses", () => {
    const operation = observationOperation("get");

    assert.deepEqual(Object.keys(operation.responses).sort(), [
      "200",
      "400",
      "401",
      "403",
      "404",
      "500",
    ]);

    const parameters = operation.parameters ?? [];
    assert.deepEqual(
      parameters.map(({ in: location, name, required }) => ({ location, name, required })),
      [
        { location: "path", name: "clienteId", required: true },
        { location: "query", name: "beforeCreatedAt", required: false },
        { location: "query", name: "beforeId", required: false },
      ],
    );

    const badRequest = operation.responses["400"]?.description ?? "";
    assert.match(badRequest, /OVERVIEW_CUSTOMER_INVALID_ID/);
    assert.match(badRequest, /OBSERVATION_INVALID_CURSOR/);
  });

  it("documents POST observations with body and error statuses", () => {
    const operation = observationOperation("post");

    assert.deepEqual(Object.keys(operation.responses).sort(), [
      "201",
      "400",
      "401",
      "403",
      "404",
      "500",
    ]);
    assert.ok(operation.requestBody, "POST sem requestBody");

    const bodySchema = document.components.schemas[
      "post_api_overview_customers_clienteId_observations_body"
    ] as { required?: string[]; properties?: Record<string, Record<string, unknown>> };
    assert.deepEqual(bodySchema.required, ["body"]);
    assert.equal(bodySchema.properties?.body?.minLength, 1);
    assert.equal(bodySchema.properties?.body?.maxLength, 2000);

    const badRequest = operation.responses["400"]?.description ?? "";
    assert.match(badRequest, /OVERVIEW_CUSTOMER_INVALID_ID/);
    assert.match(badRequest, /OBSERVATION_INVALID_BODY/);
  });

  it("lists access error codes on 403 and 404", () => {
    for (const method of ["get", "post"] as const) {
      const operation = observationOperation(method);
      assert.match(operation.responses["403"]?.description ?? "", /OVERVIEW_CUSTOMER_FORBIDDEN/);
      assert.match(operation.responses["404"]?.description ?? "", /OVERVIEW_CUSTOMER_NOT_FOUND/);
    }
  });

  it("response schemas accept the use case outputs", () => {
    const created: CreateOverviewCustomerObservationResult = {
      id: "obs-1",
      customerCode: 42,
      authorUserId: "user-1",
      authorDisplayName: "Ana",
      body: "Cliente pediu retorno",
      createdAt: "2026-09-24T10:00:00.000Z",
      updatedAt: "2026-09-24T10:00:00.000Z",
      editedAt: null,
    };
    const page: ListOverviewCustomerObservationsResult = {
      items: [created],
      hasOlder: true,
      nextBefore: { createdAt: created.createdAt, id: created.id },
    };

    assert.deepEqual(overviewCustomerObservationSchema.parse(created), created);
    assert.deepEqual(overviewCustomerObservationListResponseSchema.parse(page), page);
  });
});
