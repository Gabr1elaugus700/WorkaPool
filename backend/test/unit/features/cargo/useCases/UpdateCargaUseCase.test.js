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
        const payload = {
            destino: "Destino Teste",
            pesoMax: 5000,
            previsaoSaida: "2026-04-14",
            situacao: Carga_1.SituacaoCarga.FECHADA,
        };
        const getCargaById = node_test_1.mock.fn(async () => null);
        const updateCarga = node_test_1.mock.fn();
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act + Assert
        await strict_1.default.rejects(async () => useCase.execute(cargaId, payload), (error) => {
            strict_1.default.strictEqual(error.message, `Carga ${cargaId} não encontrada.`);
            return true;
        });
        strict_1.default.strictEqual(getCargaById.mock.calls.length, 1);
        // @ts-expect-error - mock.calls typing issue
        strict_1.default.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls.length, 0);
    });
    (0, node_test_1.it)("deve atualizar todos os campos da carga com sucesso", async () => {
        // Arrange
        const cargaId = "carga-123";
        const carga = buildCarga(123, Carga_1.SituacaoCarga.ABERTA);
        const payload = {
            destino: "Teste - 5",
            pesoMax: 5000,
            previsaoSaida: "2026-04-14",
            situacao: Carga_1.SituacaoCarga.FECHADA,
        };
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => cargaAtualizada);
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, payload);
        // Assert
        strict_1.default.strictEqual(getCargaById.mock.calls.length, 1);
        // @ts-expect-error - mock.calls typing issue
        strict_1.default.strictEqual(getCargaById.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls.length, 1);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[0], cargaId);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].destino, payload.destino);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].pesoMaximo, payload.pesoMax);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].previsaoSaida.toISOString(), new Date(payload.previsaoSaida).toISOString());
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, payload.situacao);
        strict_1.default.strictEqual(resultado.destino, payload.destino);
        strict_1.default.strictEqual(resultado.pesoMaximo, payload.pesoMax);
        strict_1.default.strictEqual(resultado.situacao, payload.situacao);
    });
    (0, node_test_1.it)("deve preservar situação atual quando payload vier sem situação", async () => {
        // Arrange
        const cargaId = "carga-234";
        const carga = buildCarga(234, Carga_1.SituacaoCarga.ABERTA);
        const payloadSemSituacao = {
            destino: "Joinville",
            pesoMax: 9000,
            previsaoSaida: "2026-04-20",
        };
        const getCargaById = node_test_1.mock.fn(async () => carga);
        const updateCarga = node_test_1.mock.fn(async (id, cargaAtualizada) => cargaAtualizada);
        const mockRepository = {
            getCargaById,
            updateCarga,
        };
        const useCase = new UpdateCarga_use_case_1.UpdateCargaUseCase(mockRepository);
        // Act
        const resultado = await useCase.execute(cargaId, payloadSemSituacao);
        // Assert
        strict_1.default.strictEqual(resultado.situacao, Carga_1.SituacaoCarga.ABERTA);
        strict_1.default.strictEqual(updateCarga.mock.calls[0].arguments[1].situacao, Carga_1.SituacaoCarga.ABERTA);
        strict_1.default.strictEqual(resultado.destino, payloadSemSituacao.destino);
        strict_1.default.strictEqual(resultado.pesoMaximo, payloadSemSituacao.pesoMax);
    });
});
