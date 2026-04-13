"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const UpdateCarga_use_case_1 = require("../../../../../src/features/cargo/useCases/UpdateCarga.use-case");
const Carga_1 = require("../../../../../src/features/cargo/entities/Carga");
const buildCarga = (codCar, situacao = Carga_1.SituacaoCarga.ABERTA) => new Carga_1.Carga({
    id: `carga-${codCar}`,
    codCar,
    destino: "Blumenau",
    pesoMaximo: 10000,
    previsaoSaida: new Date("2026-04-10T10:00:00.000Z"),
    situacao,
});
(0, node_test_1.describe)("UpdateCargaUseCase", () => {
    (0, node_test_1.after)(async () => {
        // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
    (0, node_test_1.it)("deve lançar erro quando a carga não for encontrada", async () => {
        // Arrange
        const cargaId = "carga-inexistente";
        const novaSituacao = Carga_1.SituacaoCarga.FECHADA;
        const getCargaById = node_test_1.mock.fn(async () => null);
        const updateCarga = node_test_1.mock.fn();
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act + Assert
        await strict_1.default.rejects(async () => useCase.execute(cargaId, novaSituacao), (error) => {
            strict_1.default.strictEqual(error.message, `Carga ${cargaId} não encontrada.`);
            return true;
        });
        strict_1.default.strictEqual(getCargaById.mock.calls.length, 1);
        // @ts-expect-error - mock.calls typing issue
        strict_1.default.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls.length, 0);
    });
    (0, node_test_1.it)("deve atualizar a situação da carga com sucesso", async () => {
        // Arrange
        const cargaId = "carga-123";
        const carga = buildCarga(123, Carga_1.SituacaoCarga.ABERTA);
        const novaSituacao = Carga_1.SituacaoCarga.FECHADA;
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => {
            return { ...cargaAtualizada, situacao: novaSituacao };
        });
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, novaSituacao);
        // Assert
        strict_1.default.strictEqual(getCargaById.mock.calls.length, 1);
        // @ts-expect-error - mock.calls typing issue
        strict_1.default.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls.length, 1);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, novaSituacao);
        strict_1.default.strictEqual(resultado.situacao, novaSituacao);
    });
    (0, node_test_1.it)("deve atualizar para situação CANCELADA", async () => {
        // Arrange
        const cargaId = "carga-234";
        const carga = buildCarga(234, Carga_1.SituacaoCarga.ABERTA);
        const novaSituacao = Carga_1.SituacaoCarga.CANCELADA;
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => {
            return { ...cargaAtualizada, situacao: novaSituacao };
        });
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, novaSituacao);
        // Assert
        strict_1.default.strictEqual(resultado.situacao, Carga_1.SituacaoCarga.CANCELADA);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, Carga_1.SituacaoCarga.CANCELADA);
    });
    (0, node_test_1.it)("deve atualizar para situação ENTREGUE", async () => {
        // Arrange
        const cargaId = "carga-345";
        const carga = buildCarga(345, Carga_1.SituacaoCarga.FECHADA);
        const novaSituacao = Carga_1.SituacaoCarga.ENTREGUE;
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => {
            return { ...cargaAtualizada, situacao: novaSituacao };
        });
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, novaSituacao);
        // Assert
        strict_1.default.strictEqual(resultado.situacao, Carga_1.SituacaoCarga.ENTREGUE);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, Carga_1.SituacaoCarga.ENTREGUE);
    });
    (0, node_test_1.it)("deve atualizar para situação SOLICITADA", async () => {
        // Arrange
        const cargaId = "carga-456";
        const carga = buildCarga(456, Carga_1.SituacaoCarga.ABERTA);
        const novaSituacao = Carga_1.SituacaoCarga.SOLICITADA;
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => {
            return { ...cargaAtualizada, situacao: novaSituacao };
        });
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, novaSituacao);
        // Assert
        strict_1.default.strictEqual(resultado.situacao, Carga_1.SituacaoCarga.SOLICITADA);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, Carga_1.SituacaoCarga.SOLICITADA);
    });
});
