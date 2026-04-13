"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const node_assert_1 = __importDefault(require("node:assert"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const CargoRoute_1 = __importDefault(require("../../../../src/features/cargo/http/routes/CargoRoute"));
function createTestApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/api/cargo", CargoRoute_1.default);
    return app;
}
function createToken(role) {
    return jsonwebtoken_1.default.sign({ id: "user-test", role }, "dev_secret");
}
(0, node_test_1.default)("Cargo Routes - autenticação e autorização", async (t) => {
    const app = createTestApp();
    await t.test("PATCH /:codCar/situacao sem token deve retornar 401", async () => {
        const response = await (0, supertest_1.default)(app)
            .patch("/api/cargo/1/situacao")
            .send({ situacao: "ABERTA" });
        node_assert_1.default.strictEqual(response.status, 401);
    });
    await t.test("PATCH /:codCar/situacao com role sem permissão deve retornar 403", async () => {
        const token = createToken("VENDAS");
        const response = await (0, supertest_1.default)(app)
            .patch("/api/cargo/1/situacao")
            .set("Authorization", `Bearer ${token}`)
            .send({ situacao: "ABERTA" });
        node_assert_1.default.strictEqual(response.status, 403);
    });
    await t.test("PATCH /:codCar/situacao com codCar inválido deve retornar 400", async () => {
        const token = createToken("ADMIN");
        const response = await (0, supertest_1.default)(app)
            .patch("/api/cargo/abc/situacao")
            .set("Authorization", `Bearer ${token}`)
            .send({ situacao: "ABERTA" });
        node_assert_1.default.strictEqual(response.status, 400);
        node_assert_1.default.strictEqual(response.body.error, "Código da carga inválido.");
    });
});
