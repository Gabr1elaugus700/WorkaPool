import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import { ibcPlacaCadastro } from "./ibcPlacaCadastro";

const lista: ListaIbcProdutoConfig = {
  universal: { id: "uni", corHex: "#00aa00", configurado: true, emUso: false },
  grupos: [
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
    {
      id: "cfg-z",
      grupoCodigo: "99",
      grupoDescricao: "Cloro antigo",
      sigla: "C",
      corHex: "#112233",
      configurado: true,
      emUso: true,
      encontradoNoSapiens: false,
    },
    {
      id: "cfg-s",
      grupoCodigo: "10",
      grupoDescricao: "Soda cáustica",
      sigla: "s",
      corHex: "#aa0000",
      configurado: true,
      emUso: false,
      encontradoNoSapiens: true,
    },
  ],
};

describe("ibcPlacaCadastro", () => {
  const grupos = ibcPlacaCadastro.grupos(lista);
  const universal = ibcPlacaCadastro.universalCor(lista);

  it("só oferece grupo configurado que ainda está no Sapiens", () => {
    assert.deepEqual(grupos.map((grupo) => grupo.grupoCodigo), ["10"]);
    assert.equal(grupos[0]?.sigla, "S");
    assert.equal(grupos[0]?.corHex, "#AA0000");
  });

  it("HM sem grupo não salva; NH sem grupo cadastra o universal", () => {
    assert.equal(ibcPlacaCadastro.aviso(true, "", grupos, universal) == null, false);
    assert.equal(ibcPlacaCadastro.aviso(true, "", grupos, universal), "Container homologado exige grupo de produto");
    assert.equal(ibcPlacaCadastro.aviso(false, "", grupos, universal) == null, true);
    assert.deepEqual(ibcPlacaCadastro.escolha(false, "", grupos, universal), {
      prefixo: "NH",
      corHex: "#00AA00",
      rotulo: "Universal (lavado entre usos)",
    });
  });

  it("monta o prefixo HM ou NH com a sigla e recusa universal sem placa", () => {
    assert.equal(ibcPlacaCadastro.escolha(true, "10", grupos, universal)?.prefixo, "HMS");
    assert.equal(ibcPlacaCadastro.escolha(false, "10", grupos, universal)?.prefixo, "NHS");
    assert.equal(ibcPlacaCadastro.aviso(false, "", grupos, null) == null, false);
    assert.equal(
      ibcPlacaCadastro.aviso(false, "", grupos, null),
      "Container universal sem configuração de placa",
    );
    assert.equal(ibcPlacaCadastro.cor("zz"), null);
    assert.equal(ibcPlacaCadastro.cor(null), null);
  });

  it("trata NH novo pelo flag e o legado NHM pelo prefixo", () => {
    assert.equal(ibcPlacaCadastro.naoHomologado({ identificador: "NHS00001", prefixo: "NHS", homologado: false }), true);
    assert.equal(ibcPlacaCadastro.naoHomologado({ identificador: "NH00007", prefixo: "NH", homologado: false }), true);
    assert.equal(ibcPlacaCadastro.naoHomologado({ identificador: "HMS00001", prefixo: "HMS", homologado: true }), false);
    assert.equal(ibcPlacaCadastro.naoHomologado({ identificador: "NHMS00003", prefixo: "NHMS" }), true);
    assert.equal(ibcPlacaCadastro.naoHomologado({ identificador: "HM0007", prefixo: "HM" }), false);
  });
});
