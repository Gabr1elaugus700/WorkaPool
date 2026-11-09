import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paginate } from "./paginate";

const numeros = (total: number) => Array.from({ length: total }, (_, index) => index + 1);

describe("paginate", () => {
  it("retorna uma página vazia quando não há itens", () => {
    assert.deepEqual(paginate([], 1, 10), { pageItems: [], page: 1, totalPages: 1 });
  });

  it("retorna os itens da página pedida", () => {
    assert.deepEqual(paginate(numeros(25), 2, 10), {
      pageItems: numeros(20).slice(10),
      page: 2,
      totalPages: 3,
    });
  });

  it("retorna a última página parcial", () => {
    assert.deepEqual(paginate(numeros(25), 3, 10).pageItems, [21, 22, 23, 24, 25]);
  });

  it("limita a página ao intervalo válido", () => {
    assert.equal(paginate(numeros(12), 5, 10).page, 2);
    assert.deepEqual(paginate(numeros(12), 5, 10).pageItems, [11, 12]);
    assert.equal(paginate(numeros(12), 0, 10).page, 1);
  });
});
