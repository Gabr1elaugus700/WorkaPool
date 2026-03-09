import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Configuração da API
const API_BASE_URL = 'http://localhost:3005/api/orders';

// Tipos
interface Vendedor {
  id: string;
  nome: string;
  codRep: string;
}

interface LossReasonLine {
  orderNumber: number;
  vendedor: string;
  data: string;
  cliente: string;
  cidadeEstado: string;
  produto: string;
  preco: string;
  valorTotal: string;
  margem: string;
  pesoTotal: string;
  descricao: string;
}

// Mapeia nome do vendedor para dados do vendedor
const vendedoresMap = new Map<string, Vendedor>();

// Classifica o código do motivo baseado na descrição
function classifyLossReasonCode(description: string): 'FREIGHT' | 'PRICE' | 'MARGIN' | 'STOCK' | 'OTHER' {
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
function loadVendedores(filePath: string): void {
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
function parseLossReasonLine(line: string): LossReasonLine | null {
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

// Cria Order via API
async function createOrder(orderNumber: number, idUser: string, codRep: string): Promise<string | null> {
  try {
    const response = await axios.post(API_BASE_URL, {
      orderNumber,
      status: 'LOST',
      idUser,
      codRep
    });
    
    return response.data.id;
  } catch (error: any) {
    if (error.response?.data) {
      console.error(`   ❌ Erro ao criar order: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ❌ Erro ao criar order: ${error.message}`);
    }
    return null;
  }
}

// Adiciona LossReason via API
async function addLossReason(orderId: string, code: string, description: string, submittedBy: string): Promise<boolean> {
  try {
    await axios.post(`${API_BASE_URL}/loss-reason`, {
      orderId,
      code,
      description,
      submittedBy
    });
    
    return true;
  } catch (error: any) {
    if (error.response?.data) {
      console.error(`   ❌ Erro ao adicionar loss reason: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ❌ Erro ao adicionar loss reason: ${error.message}`);
    }
    return false;
  }
}

// Processa arquivo de loss reasons
async function processLossReasons(filePath: string): Promise<void> {
  console.log('\n📂 Carregando loss reasons...');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Pula linha de cabeçalho
  const dataLines = lines.slice(1);
  
  console.log(`📊 ${dataLines.length} registros para processar\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
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
    
    // 1. Cria Order
    const orderId = await createOrder(orderNumber, vendedorData.id, vendedorData.codRep);
    
    if (!orderId) {
      console.log(`   ❌ Falha ao criar order para pedido ${orderNumber}`);
      errorCount++;
      continue;
    }
    
    console.log(`   ✅ Order criada: ${orderId}`);
    
    // 2. Classifica código
    const code = classifyLossReasonCode(descricao);
    
    // 3. Adiciona LossReason
    const success = await addLossReason(orderId, code, descricao, vendedor);
    
    if (success) {
      console.log(`   ✅ LossReason adicionada: ${code}`);
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pequeno delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`⚠️  Ignorados: ${skippedCount}`);
  console.log(`📋 Total processado: ${dataLines.length}`);
  console.log('='.repeat(60));
}

// Main
async function main() {
  try {
    console.log('🚀 Iniciando importação de Loss Reasons\n');
    
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
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
