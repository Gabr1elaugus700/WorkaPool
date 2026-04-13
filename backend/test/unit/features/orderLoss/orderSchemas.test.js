"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const node_assert_1 = __importDefault(require("node:assert"));
const orderSchemas_1 = require("../../../../src/features/orderLoss/http/schemas/orderSchemas");
(0, node_test_1.default)("GetLostOrdersFiltersSchema valida formato e intervalo de datas", async (t) => {
    await t.test("aceita filtros válidos", () => {
        const parsed = orderSchemas_1.GetLostOrdersFiltersSchema.safeParse({
            codRep: "101",
            startDate: "01-01-2026",
            endDate: "31-01-2026",
        });
        node_assert_1.default.strictEqual(parsed.success, true);
    });
    await t.test("rejeita intervalo invertido", () => {
        const parsed = orderSchemas_1.GetLostOrdersFiltersSchema.safeParse({
            startDate: "31-01-2026",
            endDate: "01-01-2026",
        });
        node_assert_1.default.strictEqual(parsed.success, false);
    });
});
