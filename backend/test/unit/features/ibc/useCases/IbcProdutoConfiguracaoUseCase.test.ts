import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import { IbcProdutoConfiguracaoUseCase } from "../../../../../src/features/ibc/useCases/IbcProdutoConfiguracao.use-case";
import type {
  IbcProdutoConfigRecord,
  IIbcProdutoConfigRepository,
  SaveIbcProdutoConfig,
} from "../../../../../src/features/ibc/repositories/IbcProdutoRepository";
import type {
  GrupoCatalogo,
  IProdutoGrupoCatalogoRepository,
} from "../../../../../src/features/ibc/repositories/ProdutoGrupoCatalogoRepository";

function cfg(
  partial: Partial<IbcProdutoConfigRecord> & Pick<IbcProdutoConfigRecord, "id" | "corHex">,
): IbcProdutoConfigRecord {
  return {
    grupoCodigo: null,
    sigla: null,
    universal: false,
    emUso: false,
    ...partial,
  };
}

function harness(configs: IbcProdutoConfigRecord[], catalogo: GrupoCatalogo[]) {
  const saved: SaveIbcProdutoConfig[] = [];
  const repo: IIbcProdutoConfigRepository = {
    list: async () => configs,
    save: async (input) => {
      saved.push(input);
      if (input.universal) {
        return cfg({ id: input.id ?? "new-id", corHex: input.corHex, universal: true });
      }
      return cfg({
        id: input.id ?? "new-id",
        grupoCodigo: input.grupoCodigo,
        sigla: input.sigla,
        corHex: input.corHex,
      });
    },
  };
  const catalogoRepo: IProdutoGrupoCatalogoRepository = {
    listDistinct: async () => catalogo,
  };
  return { useCase: new IbcProdutoConfiguracaoUseCase(repo, catalogoRepo), saved };
}

async function codigoDe(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (err) {
    assert.ok(err instanceof AppError);
    return err.code;
  }
  assert.fail("esperava erro");
}

const soda: GrupoCatalogo = { grupoCodigo: "01", grupoDescricao: "Soda" };
const acido: GrupoCatalogo = { grupoCodigo: "02", grupoDescricao: "Ácido" };

describe("IbcProdutoConfiguracaoUseCase", () => {
  it("lista grupo do catálogo sem configuração", async () => {
    const { useCase } = harness([], [soda]);

    const lista = await useCase.list(Role.LOGISTICA);

    assert.deepEqual(lista.grupos, [
      {
        id: null,
        grupoCodigo: "01",
        grupoDescricao: "Soda",
        sigla: null,
        corHex: null,
        configurado: false,
        emUso: false,
        encontradoNoSapiens: true,
      },
    ]);
    assert.deepEqual(lista.universal, {
      id: null,
      corHex: null,
      configurado: false,
      emUso: false,
    });
  });

  it("lista grupo configurado com sigla, cor e em uso", async () => {
    const { useCase } = harness(
      [cfg({ id: "cfg-1", grupoCodigo: "01", sigla: "S", corHex: "#AA0000", emUso: true })],
      [soda],
    );

    const lista = await useCase.list(Role.ADMIN);
    const grupo = lista.grupos[0];

    assert.equal(grupo?.id, "cfg-1");
    assert.equal(grupo?.sigla, "S");
    assert.equal(grupo?.corHex, "#AA0000");
    assert.equal(grupo?.configurado, true);
    assert.equal(grupo?.emUso, true);
    assert.equal(grupo?.encontradoNoSapiens, true);
  });

  it("mantém configuração cujo grupo saiu do catálogo", async () => {
    const { useCase } = harness(
      [cfg({ id: "cfg-1", grupoCodigo: "99", sigla: "Z", corHex: "#111111" })],
      [soda],
    );

    const lista = await useCase.list(Role.ALMOX);
    const orfao = lista.grupos.find((grupo) => grupo.grupoCodigo === "99");

    assert.equal(orfao?.encontradoNoSapiens, false);
    assert.equal(orfao?.grupoDescricao, null);
    assert.equal(orfao?.configurado, true);
    assert.equal(lista.grupos[0]?.grupoCodigo, "01");
  });

  it("colapsa código repetido do catálogo e não lista o universal como grupo", async () => {
    const { useCase } = harness(
      [cfg({ id: "uni", corHex: "#FFFFFF", universal: true, emUso: true })],
      [soda, { grupoCodigo: "01", grupoDescricao: "Outra" }, acido],
    );

    const lista = await useCase.list(Role.GERENTE_DPTO);

    assert.deepEqual(
      lista.grupos.map((grupo) => grupo.grupoCodigo),
      ["01", "02"],
    );
    assert.equal(lista.grupos[0]?.grupoDescricao, "Soda");
    assert.equal(lista.universal.configurado, true);
    assert.equal(lista.universal.emUso, true);
    assert.equal(lista.universal.corHex, "#FFFFFF");
  });

  it("ordena órfãos depois do catálogo", async () => {
    const { useCase } = harness(
      [
        cfg({ id: "z", grupoCodigo: "Z9", sigla: "Z", corHex: "#000001" }),
        cfg({ id: "a", grupoCodigo: "A1", sigla: "A", corHex: "#000002" }),
      ],
      [acido],
    );

    const lista = await useCase.list(Role.ADMIN);

    assert.deepEqual(
      lista.grupos.map((grupo) => grupo.grupoCodigo),
      ["02", "A1", "Z9"],
    );
  });

  it("recusa leitura para VENDAS e USER", async () => {
    const { useCase } = harness([], [soda]);

    assert.equal(await codigoDe(() => useCase.list(Role.VENDAS)), "IBC_PRODUTO_CONFIG_FORBIDDEN");
    assert.equal(await codigoDe(() => useCase.list(Role.USER)), "IBC_PRODUTO_CONFIG_FORBIDDEN");
  });

  it("cria configuração de grupo que está no catálogo", async () => {
    const { useCase, saved } = harness([], [soda]);

    const grupo = await useCase.saveGrupo({
      role: Role.ALMOX,
      grupoCodigo: " 01 ",
      sigla: " s ",
      corHex: " #aa0000 ",
    });

    assert.equal(grupo.grupoCodigo, "01");
    assert.equal(grupo.sigla, "S");
    assert.equal(grupo.corHex, "#AA0000");
    assert.equal(grupo.configurado, true);
    assert.equal(grupo.encontradoNoSapiens, true);
    assert.equal(grupo.grupoDescricao, "Soda");
    assert.deepEqual(saved, [
      { id: undefined, universal: false, grupoCodigo: "01", sigla: "S", corHex: "#AA0000" },
    ]);
  });

  it("recusa criar grupo fora do catálogo", async () => {
    const { useCase, saved } = harness([], [soda]);

    const code = await codigoDe(() =>
      useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: "99", sigla: "Z", corHex: "#111111" }),
    );

    assert.equal(code, "IBC_PRODUTO_GRUPO_NAO_ENCONTRADO");
    assert.equal(saved.length, 0);
  });

  it("atualiza configuração existente mesmo sem o grupo no catálogo", async () => {
    const existing = cfg({ id: "cfg-1", grupoCodigo: "99", sigla: "Z", corHex: "#111111" });
    const { useCase, saved } = harness([existing], []);

    const grupo = await useCase.saveGrupo({
      role: Role.ADMIN,
      grupoCodigo: "99",
      sigla: "ZA",
      corHex: "#222222",
    });

    assert.equal(grupo.encontradoNoSapiens, false);
    assert.equal(grupo.grupoDescricao, null);
    assert.equal(grupo.sigla, "ZA");
    assert.equal(saved[0]?.id, "cfg-1");
  });

  it("recusa mudar sigla ou cor de configuração em uso, inclusive baixado ou substituído", async () => {
    const existing = cfg({
      id: "cfg-1",
      grupoCodigo: "01",
      sigla: "S",
      corHex: "#AA0000",
      emUso: true,
    });
    const { useCase, saved } = harness([existing], [soda]);

    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ALMOX, grupoCodigo: "01", sigla: "SO", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_CONFIG_EM_USO",
    );
    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ALMOX, grupoCodigo: "01", sigla: "S", corHex: "#BB0000" }),
      ),
      "IBC_PRODUTO_CONFIG_EM_USO",
    );
    assert.equal(saved.length, 0);
  });

  it("trata o mesmo valor normalizado como ausência de mudança mesmo em uso", async () => {
    const existing = cfg({
      id: "cfg-1",
      grupoCodigo: "01",
      sigla: "S",
      corHex: "#AA0000",
      emUso: true,
    });
    const { useCase, saved } = harness([existing], [soda]);

    const grupo = await useCase.saveGrupo({
      role: Role.ADMIN,
      grupoCodigo: "01",
      sigla: "s",
      corHex: "#aa0000",
    });

    assert.equal(grupo.id, "cfg-1");
    assert.equal(grupo.sigla, "S");
    assert.equal(grupo.emUso, true);
    assert.equal(saved.length, 0);
  });

  it("recusa cor já usada por outro grupo ou pelo universal", async () => {
    const { useCase, saved } = harness(
      [
        cfg({ id: "cfg-2", grupoCodigo: "02", sigla: "A", corHex: "#00FF00" }),
        cfg({ id: "uni", corHex: "#FFFFFF", universal: true }),
      ],
      [soda, acido],
    );

    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ALMOX, grupoCodigo: "01", sigla: "S", corHex: "#00ff00" }),
      ),
      "IBC_PRODUTO_COR_EM_USO",
    );
    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ALMOX, grupoCodigo: "01", sigla: "S", corHex: "#ffffff" }),
      ),
      "IBC_PRODUTO_COR_EM_USO",
    );
    assert.equal(saved.length, 0);
  });

  it("recusa sigla duplicada", async () => {
    const { useCase } = harness(
      [cfg({ id: "cfg-2", grupoCodigo: "02", sigla: "S", corHex: "#00FF00" })],
      [soda, acido],
    );

    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: "01", sigla: "s", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_SIGLA_DUPLICADA",
    );
  });

  it("grava o universal e recusa cor já usada por um grupo", async () => {
    const livre = harness([], [soda]);
    const gravado = await livre.useCase.saveUniversal({ role: Role.ALMOX, corHex: "#abcdef" });

    assert.equal(gravado.corHex, "#ABCDEF");
    assert.equal(gravado.configurado, true);
    assert.deepEqual(livre.saved, [{ id: undefined, universal: true, corHex: "#ABCDEF" }]);

    const ocupado = harness(
      [cfg({ id: "cfg-1", grupoCodigo: "01", sigla: "S", corHex: "#AA0000" })],
      [soda],
    );
    assert.equal(
      await codigoDe(() => ocupado.useCase.saveUniversal({ role: Role.ADMIN, corHex: "#aa0000" })),
      "IBC_PRODUTO_COR_EM_USO",
    );
    assert.equal(ocupado.saved.length, 0);
  });

  it("mantém a cor do universal em uso e recusa outra cor", async () => {
    const existing = cfg({ id: "uni", corHex: "#FFFFFF", universal: true, emUso: true });
    const { useCase, saved } = harness([existing], []);

    const igual = await useCase.saveUniversal({ role: Role.ADMIN, corHex: "#ffffff" });
    assert.equal(igual.id, "uni");
    assert.equal(igual.emUso, true);
    assert.equal(saved.length, 0);
    assert.equal(
      await codigoDe(() => useCase.saveUniversal({ role: Role.ALMOX, corHex: "#000000" })),
      "IBC_PRODUTO_CONFIG_EM_USO",
    );
  });

  it("recusa escrita para LOGISTICA e VENDAS", async () => {
    const { useCase, saved } = harness([], [soda]);

    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.LOGISTICA, grupoCodigo: "01", sigla: "S", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_CONFIG_FORBIDDEN",
    );
    assert.equal(
      await codigoDe(() => useCase.saveUniversal({ role: Role.VENDAS, corHex: "#AA0000" })),
      "IBC_PRODUTO_CONFIG_FORBIDDEN",
    );
    assert.equal(saved.length, 0);
  });

  it("recusa sigla, cor e código de grupo inválidos", async () => {
    const { useCase, saved } = harness([], [soda]);

    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: "01", sigla: "S1", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_SIGLA_INVALIDA",
    );
    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: "01", sigla: "S", corHex: "AA0000" }),
      ),
      "IBC_PRODUTO_COR_INVALIDA",
    );
    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: " ", sigla: "S", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_GRUPO_INVALIDO",
    );
    assert.equal(
      await codigoDe(() =>
        useCase.saveGrupo({ role: Role.ADMIN, grupoCodigo: "12345678901", sigla: "S", corHex: "#AA0000" }),
      ),
      "IBC_PRODUTO_GRUPO_INVALIDO",
    );
    assert.equal(
      await codigoDe(() => useCase.saveUniversal({ role: Role.ADMIN, corHex: "#FFF" })),
      "IBC_PRODUTO_COR_INVALIDA",
    );
    assert.equal(saved.length, 0);
  });
});
