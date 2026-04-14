import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { UpdateCargaUseCase } from "../../../../../src/features/cargo/useCases/UpdateCarga.use-case";
import {
  Carga,
  SituacaoCarga,
} from "../../../../../src/features/cargo/entities/Carga";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";
import { CreateCargaDTO } from "../../../../../src/features/cargo/http/schemas/cargoSchema";

const buildCarga = (
  codCar: number,
  situacao: SituacaoCarga = SituacaoCarga.ABERTA,
): Carga =>
  new Carga({
    id: `carga-${codCar}`,
    codCar,
    destino: "Blumenau",
    pesoMaximo: 10000,
    previsaoSaida: new Date("2026-04-10T10:00:00.000Z"),
    situacao,
  });

describe("UpdateCargaUseCase", () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("deve lançar erro quando a carga não for encontrada", async () => {
    // Arrange
    const cargaId = "carga-inexistente";
    const payload: CreateCargaDTO = {
      destino: "Destino Teste",
      pesoMax: 5000,
      previsaoSaida: "2026-04-14",
      situacao: SituacaoCarga.FECHADA,
    };

    const getCargaById = mock.fn(async () => null);
    const updateCarga = mock.fn();

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act + Assert
    await assert.rejects(
      async () => useCase.execute(cargaId, payload),
      (error: any) => {
        assert.strictEqual(error.message, `Carga ${cargaId} não encontrada.`);
        return true;
      },
    );

    assert.strictEqual(getCargaById.mock.calls.length, 1);
    // @ts-expect-error - mock.calls typing issue
    assert.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);
    assert.strictEqual(updateCarga.mock.calls.length, 0);
  });

  it("deve atualizar todos os campos da carga com sucesso", async () => {
    // Arrange
    const cargaId = "carga-123";
    const carga = buildCarga(123, SituacaoCarga.ABERTA);
    const payload: CreateCargaDTO = {
      destino: "Teste - 5",
      pesoMax: 5000,
      previsaoSaida: "2026-04-14",
      situacao: SituacaoCarga.FECHADA,
    };

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => cargaAtualizada);

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, payload);

    // Assert
    assert.strictEqual(getCargaById.mock.calls.length, 1);
    // @ts-expect-error - mock.calls typing issue
    assert.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);

    assert.strictEqual(updateCarga.mock.calls.length, 1);
    assert.strictEqual(updateCarga.mock.calls[0].arguments[0], cargaId);
    assert.strictEqual(updateCarga.mock.calls[0].arguments[1].destino, payload.destino);
    assert.strictEqual(updateCarga.mock.calls[0].arguments[1].pesoMaximo, payload.pesoMax);
    assert.strictEqual(
      updateCarga.mock.calls[0].arguments[1].previsaoSaida.toISOString(),
      new Date(payload.previsaoSaida).toISOString(),
    );
    assert.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, payload.situacao);

    assert.strictEqual(resultado.destino, payload.destino);
    assert.strictEqual(resultado.pesoMaximo, payload.pesoMax);
    assert.strictEqual(resultado.situacao, payload.situacao);
  });

  it("deve preservar situação atual quando payload vier sem situação", async () => {
    // Arrange
    const cargaId = "carga-234";
    const carga = buildCarga(234, SituacaoCarga.ABERTA);
    const payloadSemSituacao: CreateCargaDTO = {
      destino: "Joinville",
      pesoMax: 9000,
      previsaoSaida: "2026-04-20",
    };

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => cargaAtualizada);

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, payloadSemSituacao);

    // Assert
    assert.strictEqual(resultado.situacao, SituacaoCarga.ABERTA);
    assert.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, SituacaoCarga.ABERTA);
    assert.strictEqual(resultado.destino, payloadSemSituacao.destino);
    assert.strictEqual(resultado.pesoMaximo, payloadSemSituacao.pesoMax);
  });
});
