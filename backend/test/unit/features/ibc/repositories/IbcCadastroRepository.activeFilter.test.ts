import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { IbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IbcCadastroRepository";

const ACTIVE_IBC_WHERE = {
  baixadoEm: null,
  convertedToContainerId: null,
};

type IbcQueryArgs = { where?: unknown };

function buildRepository() {
  const findMany = mock.fn(async (_args: IbcQueryArgs) => []);
  const count = mock.fn(async (_args: IbcQueryArgs) => 0);
  const repository = new IbcCadastroRepository({
    ibc: { findMany, count },
  } as unknown as PrismaClient);
  return { repository, findMany, count };
}

describe("IbcCadastroRepository active filter (#245)", () => {
  it("listActiveIbcs omits baixados and replaced IBCs", async () => {
    const { repository, findMany } = buildRepository();

    await repository.listActiveIbcs();

    assert.equal(findMany.mock.calls.length, 1);
    assert.deepEqual(findMany.mock.calls[0]?.arguments[0]?.where, ACTIVE_IBC_WHERE);
  });

  it("listIbcs applies the active filter unless the caller asks for baixados", async () => {
    const { repository, findMany } = buildRepository();

    await repository.listIbcs({});
    await repository.listIbcs({ incluirBaixados: false });
    await repository.listIbcs({ incluirBaixados: true });

    assert.deepEqual(findMany.mock.calls[0]?.arguments[0]?.where, ACTIVE_IBC_WHERE);
    assert.deepEqual(findMany.mock.calls[1]?.arguments[0]?.where, ACTIVE_IBC_WHERE);
    assert.equal(findMany.mock.calls[2]?.arguments[0]?.where, undefined);
  });

  it("countVivosWp excludes replaced IBCs", async () => {
    const { repository, count } = buildRepository();

    await repository.countVivosWp();

    assert.equal(count.mock.calls.length, 1);
    assert.deepEqual(count.mock.calls[0]?.arguments[0]?.where, ACTIVE_IBC_WHERE);
  });
});
