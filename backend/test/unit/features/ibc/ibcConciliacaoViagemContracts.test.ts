import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOpenApiDocument } from "../../../../src/docs/openapi/buildOpenApi";
import { ibcPaths } from "../../../../src/docs/paths/ibc.paths";

type Operacao = {
  description?: string;
  responses: Record<string, { description?: string; content?: { "application/json"?: { schema?: { $ref?: string } } } }>;
};

function operacao(path: string, method: "put" | "post"): Operacao {
  const document = buildOpenApiDocument(ibcPaths) as {
    paths: Record<string, Partial<Record<"put" | "post", Operacao>>>;
    components: { schemas: Record<string, { properties?: Record<string, { properties?: Record<string, unknown> }> }> };
  };
  const item = document.paths[path]?.[method];
  assert.ok(item, `${method} ${path}`);
  const erro = document.components.schemas.IbcProdutoIncompativelError;
  assert.deepEqual(Object.keys(erro?.properties?.details?.properties ?? {}).sort(), [
    "grupoContainer",
    "gruposPermitidos",
    "identificador",
  ]);
  return item;
}

describe("OpenAPI da conciliação da volta", () => {
  it("documenta o 409 IBC_PRODUTO_INCOMPATIVEL no PUT e no fechar viagem", () => {
    const put = operacao("/api/ibc/expedicoes/{codCar}/conciliacao", "put");
    const fechar = operacao("/api/ibc/expedicoes/{codCar}/fechar-viagem", "post");

    assert.match(put.description ?? "", /Retornou não checa/);
    assert.match(fechar.description ?? "", /Antes de gravar/);
    assert.match(put.responses["409"]?.description ?? "", /IBC_PRODUTO_INCOMPATIVEL/);
    assert.match(fechar.responses["409"]?.description ?? "", /IBC_PRODUTO_INCOMPATIVEL/);
    assert.equal(
      put.responses["409"]?.content?.["application/json"]?.schema?.$ref,
      "#/components/schemas/IbcProdutoIncompativelError",
    );
    assert.equal(
      fechar.responses["409"]?.content?.["application/json"]?.schema?.$ref,
      "#/components/schemas/IbcProdutoIncompativelError",
    );
  });
});
