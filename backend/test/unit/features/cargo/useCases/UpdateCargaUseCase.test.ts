import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { UpdateCargaUseCase } from "../../../../../src/features/cargo/useCases/UpdateCarga.use-case";
import {
  Carga,
  SituacaoCarga,
} from "../../../../../src/features/cargo/entities/Carga";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";

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
    const novaSituacao = SituacaoCarga.FECHADA;

    const getCargaById = mock.fn(async () => null);
    const updateCarga = mock.fn();

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act + Assert
    await assert.rejects(
      async () => useCase.execute(cargaId, novaSituacao),
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

  it("deve atualizar a situação da carga com sucesso", async () => {
    // Arrange
    const cargaId = "carga-123";
    const carga = buildCarga(123, SituacaoCarga.ABERTA);
    const novaSituacao = SituacaoCarga.FECHADA;

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => {
      return { ...cargaAtualizada, situacao: novaSituacao };
    });

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, novaSituacao);

    // Assert
    assert.strictEqual(getCargaById.mock.calls.length, 1);
    // @ts-expect-error - mock.calls typing issue
    assert.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);

    assert.strictEqual(updateCarga.mock.calls.length, 1);
    assert.strictEqual(updateCarga.mock.calls[0].arguments[0], cargaId);
    assert.strictEqual(
      updateCarga.mock.calls[0].arguments[1].situacao,
      novaSituacao,
    );

    assert.strictEqual(resultado.situacao, novaSituacao);
  });

  it("deve atualizar para situação CANCELADA", async () => {
    // Arrange
    const cargaId = "carga-234";
    const carga = buildCarga(234, SituacaoCarga.ABERTA);
    const novaSituacao = SituacaoCarga.CANCELADA;

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => {
      return { ...cargaAtualizada, situacao: novaSituacao };
    });

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, novaSituacao);

    // Assert
    assert.strictEqual(resultado.situacao, SituacaoCarga.CANCELADA);
    assert.strictEqual(
      updateCarga.mock.calls[0].arguments[1].situacao,
      SituacaoCarga.CANCELADA,
    );
  });

  it("deve atualizar para situação ENTREGUE", async () => {
    // Arrange
    const cargaId = "carga-345";
    const carga = buildCarga(345, SituacaoCarga.FECHADA);
    const novaSituacao = SituacaoCarga.ENTREGUE;

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => {
      return { ...cargaAtualizada, situacao: novaSituacao };
    });

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, novaSituacao);

    // Assert
    assert.strictEqual(resultado.situacao, SituacaoCarga.ENTREGUE);
    assert.strictEqual(
      updateCarga.mock.calls[0].arguments[1].situacao,
      SituacaoCarga.ENTREGUE,
    );
  });

  it("deve atualizar para situação SOLICITADA", async () => {
    // Arrange
    const cargaId = "carga-456";
    const carga = buildCarga(456, SituacaoCarga.ABERTA);
    const novaSituacao = SituacaoCarga.SOLICITADA;

    const getCargaById = mock.fn(async () => carga);
    const updateCarga = mock.fn(async (id: string, cargaAtualizada: Carga) => {
      return { ...cargaAtualizada, situacao: novaSituacao };
    });

    const mockRepository: ICargoRepository = {
      getCargaById,
      updateCarga,
    } as any;

    const useCase = new UpdateCargaUseCase(mockRepository);

    // Act
    const resultado = await useCase.execute(cargaId, novaSituacao);

    // Assert
    assert.strictEqual(resultado.situacao, SituacaoCarga.SOLICITADA);
    assert.strictEqual(
      updateCarga.mock.calls[0].arguments[1].situacao,
      SituacaoCarga.SOLICITADA,
    );
  });
});
