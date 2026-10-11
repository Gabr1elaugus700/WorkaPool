import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

function createToken(role: string) {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

test("IBC Routes - autenticação e autorização", async (t) => {
  const app = createTestApp();

  await t.test("GET /cargas-expedicao sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/ibc/cargas-expedicao");
    assert.strictEqual(response.status, 401);
  });

  await t.test("GET /events sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/ibc/events");
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST /alocacoes sem token deve retornar 401", async () => {
    const response = await request(app)
      .post("/api/ibc/alocacoes")
      .send({ codCar: 1, numPed: "1120", identificador: "H0045" });
    assert.strictEqual(response.status, 401);
  });

  await t.test(
    "POST /alocacoes com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1, numPed: "1120", identificador: "H0045" });
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "DELETE /alocacoes/:id com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .delete("/api/ibc/alocacoes/aloc-1")
        .set("Authorization", `Bearer ${token}`);
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes sem token deve retornar 401",
    async () => {
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 401);
    },
  );

  await t.test(
    "DELETE /alocacoes/:id sem token deve retornar 401",
    async () => {
      const response = await request(app).delete(
        "/api/ibc/alocacoes/aloc-1",
      );
      assert.strictEqual(response.status, 401);
    },
  );

  await t.test(
    "POST /alocacoes com ALMOX autenticado passa requireRoles (não 403)",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          codCar: 1,
          numPed: "1120",
          identificador: "H0045",
        });
      assert.notStrictEqual(response.status, 401);
      assert.notStrictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes com ALMOX autenticado passa requireRoles (não 403)",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.notStrictEqual(response.status, 401);
      assert.notStrictEqual(response.status, 403);
    },
  );

  await t.test(
    "GET /cargas-expedicao/:codCar com codCar inválido deve retornar 400",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .get("/api/ibc/cargas-expedicao/abc")
        .set("Authorization", `Bearer ${token}`);
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.code, "IBC_COD_CAR_INVALID");
    },
  );

  await t.test(
    "POST /alocacoes com body inválido (ALMOX) deve retornar 400",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.code, "IBC_ALOCACAO_INVALID_BODY");
    },
  );

  await t.test("cadastro routes sem token retornam 401", async () => {
    const create = await request(app)
      .post("/api/ibc")
      .send({ dataLimite: "2099-12-31" });
    const createLote = await request(app)
      .post("/api/ibc/lote")
      .send({ quantidade: 2, dataLimite: "2099-12-31" });
    const list = await request(app).get("/api/ibc");
    const alerts = await request(app).get("/api/ibc/alerts");
    const patch = await request(app)
      .patch("/api/ibc/ibc-1")
      .send({ dataLimite: "2099-12-31" });
    const softDelete = await request(app).delete("/api/ibc/ibc-1");
    const createProduto = await request(app)
      .post("/api/ibc/produtos")
      .send({ nome: "Soda", abreviacao: "S" });
    const listProdutos = await request(app).get("/api/ibc/produtos");
    const updateProduto = await request(app)
      .patch("/api/ibc/produtos/prod-1")
      .send({ nome: "Soda A", abreviacao: "SA" });
    const convertStatus = await request(app)
      .patch("/api/ibc/ibc-1/converter-nao-homologado")
      .send({ confirmado: true });
    const changeProduto = await request(app)
      .patch("/api/ibc/ibc-1/produto")
      .send({ produtoId: "8d7f903e-f53d-4c62-80b2-48f3c9655d71", confirmado: true });

    assert.strictEqual(create.status, 401);
    assert.strictEqual(createLote.status, 401);
    assert.strictEqual(list.status, 401);
    assert.strictEqual(alerts.status, 401);
    assert.strictEqual(patch.status, 401);
    assert.strictEqual(softDelete.status, 401);
    assert.strictEqual(createProduto.status, 401);
    assert.strictEqual(listProdutos.status, 401);
    assert.strictEqual(updateProduto.status, 401);
    assert.strictEqual(convertStatus.status, 401);
    assert.strictEqual(changeProduto.status, 401);
  });

  for (const role of ["LOGISTICA", "GERENTE_DPTO"] as const) {
    await t.test(`${role} não pode mutar cadastro`, async () => {
      const token = createToken(role);
      const create = await request(app)
        .post("/api/ibc")
        .set("Authorization", `Bearer ${token}`)
        .send({ dataLimite: "2099-12-31" });
      const createLote = await request(app)
        .post("/api/ibc/lote")
        .set("Authorization", `Bearer ${token}`)
        .send({ quantidade: 2, dataLimite: "2099-12-31" });
      const patch = await request(app)
        .patch("/api/ibc/ibc-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ dataLimite: "2099-12-31" });
      const softDelete = await request(app)
        .delete("/api/ibc/ibc-1")
        .set("Authorization", `Bearer ${token}`);
      const createProduto = await request(app)
        .post("/api/ibc/produtos")
        .set("Authorization", `Bearer ${token}`)
        .send({ nome: "Soda", abreviacao: "S" });
      const updateProduto = await request(app)
        .patch("/api/ibc/produtos/prod-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ nome: "Soda A", abreviacao: "SA" });
      const convertStatus = await request(app)
        .patch("/api/ibc/ibc-1/converter-nao-homologado")
        .set("Authorization", `Bearer ${token}`)
        .send({ confirmado: true });
      const changeProduto = await request(app)
        .patch("/api/ibc/ibc-1/produto")
        .set("Authorization", `Bearer ${token}`)
        .send({ produtoId: "8d7f903e-f53d-4c62-80b2-48f3c9655d71", confirmado: true });

      assert.strictEqual(create.status, 403);
      assert.strictEqual(createLote.status, 403);
      assert.strictEqual(patch.status, 403);
      assert.strictEqual(softDelete.status, 403);
      assert.strictEqual(createProduto.status, 403);
      assert.strictEqual(updateProduto.status, 403);
      assert.strictEqual(convertStatus.status, 403);
      assert.strictEqual(changeProduto.status, 403);
    });
  }

  await t.test("GET /:id/historico sem token retorna 401 e VENDAS retorna 403", async () => {
    const anonymous = await request(app).get("/api/ibc/ibc-1/historico");
    const vendas = await request(app)
      .get("/api/ibc/ibc-1/historico")
      .set("Authorization", `Bearer ${createToken("VENDAS")}`);

    assert.strictEqual(anonymous.status, 401);
    assert.strictEqual(vendas.status, 403);
  });

  await t.test("VENDAS e USER não podem converter nem mudar produto", async () => {
    for (const role of ["VENDAS", "USER"]) {
      const token = createToken(role);
      const convertStatus = await request(app)
        .patch("/api/ibc/ibc-1/converter-nao-homologado")
        .set("Authorization", `Bearer ${token}`)
        .send({ confirmado: true });
      const changeProduto = await request(app)
        .patch("/api/ibc/ibc-1/produto")
        .set("Authorization", `Bearer ${token}`)
        .send({ produtoId: "8d7f903e-f53d-4c62-80b2-48f3c9655d71", confirmado: true });

      assert.strictEqual(convertStatus.status, 403);
      assert.strictEqual(changeProduto.status, 403);
    }
  });

  await t.test("mutação sem confirmação é rejeitada antes de tocar o banco", async () => {
    const token = createToken("ALMOX");
    const convertWithoutFlag = await request(app)
      .patch("/api/ibc/ibc-1/converter-nao-homologado")
      .set("Authorization", `Bearer ${token}`)
      .send({ observacao: "sem confirmar" });
    const convertFalse = await request(app)
      .patch("/api/ibc/ibc-1/converter-nao-homologado")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirmado: false });
    const changeWithoutFlag = await request(app)
      .patch("/api/ibc/ibc-1/produto")
      .set("Authorization", `Bearer ${token}`)
      .send({ produtoId: "8d7f903e-f53d-4c62-80b2-48f3c9655d71" });
    const observacaoLonga = await request(app)
      .patch("/api/ibc/ibc-1/converter-nao-homologado")
      .set("Authorization", `Bearer ${token}`)
      .send({ confirmado: true, observacao: "x".repeat(501) });

    assert.strictEqual(convertWithoutFlag.status, 400);
    assert.strictEqual(convertWithoutFlag.body.code, "IBC_STATUS_CONFIRMATION_REQUIRED");
    assert.strictEqual(convertFalse.status, 400);
    assert.strictEqual(changeWithoutFlag.status, 400);
    assert.strictEqual(changeWithoutFlag.body.code, "IBC_PRODUCT_CHANGE_CONFIRMATION_REQUIRED");
    assert.strictEqual(observacaoLonga.status, 400);
  });

  await t.test("checklist-itens: 401 sem token, LOGISTICA lê mas não muta", async () => {
    const anonymous = await request(app).get("/api/ibc/checklist-itens");
    const token = createToken("LOGISTICA");
    const list = await request(app)
      .get("/api/ibc/checklist-itens")
      .set("Authorization", `Bearer ${token}`);
    const create = await request(app)
      .post("/api/ibc/checklist-itens")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "Tampa" });
    const update = await request(app)
      .patch("/api/ibc/checklist-itens/item-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ ativo: false });

    assert.strictEqual(anonymous.status, 401);
    assert.notStrictEqual(list.status, 401);
    assert.notStrictEqual(list.status, 403);
    assert.strictEqual(create.status, 403);
    assert.strictEqual(update.status, 403);
  });

  await t.test("checklists: 401 sem token, LOGISTICA lê mas não muta", async () => {
    const anonymous = await request(app).get("/api/ibc/checklists");
    const token = createToken("LOGISTICA");
    const list = await request(app)
      .get("/api/ibc/checklists")
      .set("Authorization", `Bearer ${token}`);
    const create = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Checklist Soda" });
    const update = await request(app)
      .patch("/api/ibc/checklists/checklist-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ ativo: false });

    assert.strictEqual(anonymous.status, 401);
    assert.notStrictEqual(list.status, 401);
    assert.notStrictEqual(list.status, 403);
    assert.strictEqual(create.status, 403);
    assert.strictEqual(update.status, 403);
  });

  await t.test("GERENTE_DPTO não muta checklist-itens nem checklists", async () => {
    const token = createToken("GERENTE_DPTO");
    const mutations = [
      { method: "post", path: "/checklist-itens", body: { descricao: "Tampa" } },
      { method: "patch", path: "/checklist-itens/item-1", body: { ativo: false } },
      { method: "post", path: "/checklists", body: { nome: "Checklist Soda" } },
      { method: "patch", path: "/checklists/checklist-1", body: { ativo: false } },
    ] as const;

    for (const { method, path, body } of mutations) {
      const response = await request(app)
        [method](`/api/ibc${path}`)
        .set("Authorization", `Bearer ${token}`)
        .send(body);
      assert.strictEqual(response.status, 403, `${method.toUpperCase()} ${path}`);
    }
  });

  await t.test("GET /:id/checklists: 401 sem token, LOGISTICA e GERENTE_DPTO leem, VENDAS 403", async () => {
    const anonymous = await request(app).get("/api/ibc/ibc-1/checklists");
    const vendas = await request(app)
      .get("/api/ibc/ibc-1/checklists")
      .set("Authorization", `Bearer ${createToken("VENDAS")}`);
    assert.strictEqual(anonymous.status, 401);
    assert.strictEqual(vendas.status, 403);

    for (const role of ["LOGISTICA", "GERENTE_DPTO"] as const) {
      const list = await request(app)
        .get("/api/ibc/ibc-1/checklists")
        .set("Authorization", `Bearer ${createToken(role)}`);
      assert.notStrictEqual(list.status, 401, role);
      assert.notStrictEqual(list.status, 403, role);
    }
  });

  await t.test("POST /:id/checklists: 401 sem token, 403 para LOGISTICA/GERENTE_DPTO/VENDAS", async () => {
    const anonymous = await request(app).post("/api/ibc/ibc-1/checklists").send({});
    assert.strictEqual(anonymous.status, 401);

    for (const role of ["LOGISTICA", "GERENTE_DPTO", "VENDAS", "USER"]) {
      const response = await request(app)
        .post("/api/ibc/ibc-1/checklists")
        .set("Authorization", `Bearer ${createToken(role)}`)
        .send({ checklistModeloId: "00000000-0000-0000-0000-000000000000" });
      assert.strictEqual(response.status, 403, role);
    }
  });

  await t.test("DELETE /:id/checklists/:checklistModeloId: 401 sem token, 403 para LOGISTICA/GERENTE_DPTO/VENDAS", async () => {
    const anonymous = await request(app).delete("/api/ibc/ibc-1/checklists/checklist-1");
    assert.strictEqual(anonymous.status, 401);

    for (const role of ["LOGISTICA", "GERENTE_DPTO", "VENDAS", "USER"]) {
      const response = await request(app)
        .delete("/api/ibc/ibc-1/checklists/checklist-1")
        .set("Authorization", `Bearer ${createToken(role)}`);
      assert.strictEqual(response.status, 403, role);
    }
  });

  await t.test("POST /:id/inspecoes: 401 sem token, 403 para LOGISTICA/GERENTE_DPTO/VENDAS", async () => {
    const anonymous = await request(app).post("/api/ibc/ibc-1/inspecoes").send({});
    assert.strictEqual(anonymous.status, 401);

    for (const role of ["LOGISTICA", "GERENTE_DPTO", "VENDAS", "USER"]) {
      const response = await request(app)
        .post("/api/ibc/ibc-1/inspecoes")
        .set("Authorization", `Bearer ${createToken(role)}`)
        .send({
          checklistModeloId: "00000000-0000-0000-0000-000000000000",
          respostas: [{ checklistItemId: "00000000-0000-0000-0000-000000000001", nota: 8 }],
        });
      assert.strictEqual(response.status, 403, role);
    }
  });

  await t.test("POST /:id/inspecoes com body inválido (ALMOX) retorna 400 antes de tocar o banco", async () => {
    const response = await request(app)
      .post("/api/ibc/ibc-1/inspecoes")
      .set("Authorization", `Bearer ${createToken("ALMOX")}`)
      .send({ checklistModeloId: "nao-e-uuid", respostas: [] });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, "IBC_INSPECAO_INVALID_BODY");
  });

  for (const role of ["LOGISTICA", "GERENTE_DPTO"] as const) {
    await t.test(`${role} pode ler pool, alerts, produtos, histórico e inspeções`, async () => {
      const token = createToken(role);
      for (const path of ["", "/alerts", "/produtos", "/ibc-1/historico", "/ibc-1/inspecoes"]) {
        const response = await request(app)
          .get(`/api/ibc${path}`)
          .set("Authorization", `Bearer ${token}`);
        assert.notStrictEqual(response.status, 401, path);
        assert.notStrictEqual(response.status, 403, path);
      }
    });
  }
});
