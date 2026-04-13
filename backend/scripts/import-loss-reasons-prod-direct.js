"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const client_1 = require("@prisma/client");
const dotenv = __importStar(require("dotenv"));
// Carrega variáveis de ambiente de produção
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
// Cliente Prisma
const prisma = new client_1.PrismaClient();
// Mapeia nome do vendedor para dados do vendedor
const vendedoresMap = new Map();
// Classifica o código do motivo baseado na descrição
function classifyLossReasonCode(description) {
    const desc = description.toLowerCase();
    if (desc.includes('frete') || desc.includes('freight') || desc.includes('entrega')) {
        return 'FREIGHT';
    }
    if (desc.includes('preço') || desc.includes('preco') || desc.includes('price') || desc.includes('valor') || desc.includes('mais barato')) {
        return 'PRICE';
    }
    if (desc.includes('margem') || desc.includes('margin')) {
        return 'MARGIN';
    }
    if (desc.includes('estoque') || desc.includes('stock') || desc.includes('não tínhamos') || desc.includes('produto para')) {
        return 'STOCK';
    }
    return 'OTHER';
}
// Carrega vendedores do arquivo
function loadVendedores(filePath) {
    console.log('📂 Carregando vendedores...');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 4) {
            const [id, nome, username, password, departamento, ...rest] = parts;
            const codRep = rest[1]?.trim() || '999';
            const normalizadoNome = nome.trim().toUpperCase();
            vendedoresMap.set(normalizadoNome, {
                id: id.trim(),
                nome: nome.trim(),
                codRep: codRep
            });
        }
    }
    console.log(`✅ ${vendedoresMap.size} vendedores carregados`);
}
// Parse da linha do arquivo de loss reasons
function parseLossReasonLine(line) {
    const parts = line.split('\t');
    if (parts.length < 11) {
        return null;
    }
    const [pedido, vendedor, data, cliente, cidadeEstado, produto, preco, valorTotal, margem, pesoTotal, descricao] = parts;
    const orderNumber = parseInt(pedido?.trim());
    if (isNaN(orderNumber) || orderNumber === 0) {
        return null;
    }
    return {
        orderNumber,
        vendedor: vendedor?.trim() || '',
        data: data?.trim() || '',
        cliente: cliente?.trim() || '',
        cidadeEstado: cidadeEstado?.trim() || '',
        produto: produto?.trim() || '',
        preco: preco?.trim() || '',
        valorTotal: valorTotal?.trim() || '',
        margem: margem?.trim() || '',
        pesoTotal: pesoTotal?.trim() || '',
        descricao: descricao?.trim() || 'Sem descrição'
    };
}
// Cria ou busca Order existente
async function createOrGetOrder(orderNumber, idUser, codRep) {
    try {
        // Primeiro verifica se já existe
        const existing = await prisma.order.findFirst({
            where: { orderNumber }
        });
        if (existing) {
            return { id: existing.id, alreadyExists: true };
        }
        // Se não existe, cria
        const order = await prisma.order.create({
            data: {
                orderNumber,
                status: 'LOST',
                idUser,
                codRep
            }
        });
        return { id: order.id, alreadyExists: false };
    }
    catch (error) {
        console.error(`   ❌ Erro ao criar/buscar order: ${error.message}`);
        return { id: null, alreadyExists: false };
    }
}
// Adiciona LossReason
async function addLossReason(orderId, code, description, submittedBy) {
    try {
        // Verifica se já existe LossReason para esta order
        const existing = await prisma.lossReason.findUnique({
            where: { orderId }
        });
        if (existing) {
            console.log(`   ℹ️  LossReason já existe para esta order`);
            return true;
        }
        await prisma.lossReason.create({
            data: {
                orderId,
                code,
                description,
                submittedBy
            }
        });
        return true;
    }
    catch (error) {
        console.error(`   ❌ Erro ao adicionar loss reason: ${error.message}`);
        return false;
    }
}
// Processa arquivo de loss reasons
async function processLossReasons(filePath) {
    console.log('\n📂 Carregando loss reasons...');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    // Pula linha de cabeçalho
    const dataLines = lines.slice(1);
    console.log(`📊 ${dataLines.length} registros para processar\n`);
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let ordersCreatedCount = 0;
    let ordersExistingCount = 0;
    let lossReasonExistingCount = 0;
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const parsed = parseLossReasonLine(line);
        if (!parsed) {
            skippedCount++;
            continue;
        }
        const { orderNumber, vendedor, descricao } = parsed;
        // Busca vendedor
        const vendedorNormalizado = vendedor.toUpperCase();
        const vendedorData = vendedoresMap.get(vendedorNormalizado);
        if (!vendedorData) {
            console.log(`⚠️  [${i + 1}/${dataLines.length}] Pedido ${orderNumber} - Vendedor "${vendedor}" não encontrado`);
            skippedCount++;
            continue;
        }
        console.log(`🔄 [${i + 1}/${dataLines.length}] Processando pedido ${orderNumber} - ${vendedor}`);
        // 1. Cria ou busca Order
        const { id: orderId, alreadyExists } = await createOrGetOrder(orderNumber, vendedorData.id, vendedorData.codRep);
        if (!orderId) {
            console.log(`   ❌ Falha ao criar/buscar order para pedido ${orderNumber}`);
            errorCount++;
            continue;
        }
        if (alreadyExists) {
            console.log(`   ℹ️  Order já existe: ${orderId}`);
            ordersExistingCount++;
        }
        else {
            console.log(`   ✅ Order criada: ${orderId}`);
            ordersCreatedCount++;
        }
        // 2. Classifica código
        const code = classifyLossReasonCode(descricao);
        // 3. Adiciona LossReason
        const success = await addLossReason(orderId, code, descricao, vendedor);
        if (success) {
            console.log(`   ✅ LossReason adicionada: ${code}`);
            successCount++;
        }
        else {
            errorCount++;
        }
    }
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO - PRODUÇÃO (DIRECT DB)');
    console.log('='.repeat(60));
    console.log(`✅ LossReasons adicionadas: ${successCount}`);
    console.log(`🆕 Orders criadas: ${ordersCreatedCount}`);
    console.log(`♻️  Orders já existiam: ${ordersExistingCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⚠️  Ignorados: ${skippedCount}`);
    console.log(`📋 Total processado: ${dataLines.length}`);
    console.log('='.repeat(60));
}
// Main
async function main() {
    try {
        console.log('🚀 Iniciando importação de Loss Reasons - PRODUÇÃO (DIRECT DB)\n');
        console.log(`🗄️  Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'N/A'}\n`);
        const vendedoresPath = path.join(__dirname, 'vendedores.txt');
        const lossReasonsPath = path.join(__dirname, 'loss_reasons_example.txt');
        // Verifica se os arquivos existem
        if (!fs.existsSync(vendedoresPath)) {
            console.error(`❌ Arquivo não encontrado: ${vendedoresPath}`);
            process.exit(1);
        }
        if (!fs.existsSync(lossReasonsPath)) {
            console.error(`❌ Arquivo não encontrado: ${lossReasonsPath}`);
            process.exit(1);
        }
        // 1. Carrega vendedores
        loadVendedores(vendedoresPath);
        // 2. Processa loss reasons
        await processLossReasons(lossReasonsPath);
        console.log('\n✅ Importação concluída!');
    }
    catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
