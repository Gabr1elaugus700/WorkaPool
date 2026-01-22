import { Order, Product } from "../types/orderLoss.types";

// Função auxiliar para gerar produtos mockados
const generateMockProducts = (count: number, seed: number): Product[] => {
  const productNames = [
    "Produto Premium A",
    "Produto Standard B",
    "Produto Econômico C",
    "Produto Elite D",
    "Produto Master E",
    "Produto Plus F",
    "Produto Ultra G",
    "Produto Super H",
  ];

  return Array.from({ length: count }, (_, i) => {
    const productIndex = (seed + i) % productNames.length;
    const quantity = Math.floor(Math.random() * 50) + 10;
    const weight = Math.floor(Math.random() * 500) + 50;
    const unitPrice = Math.random() * 500 + 100;
    
    return {
      id: `PROD-${(seed * 1000 + i).toString().padStart(6, '0')}`,
      name: productNames[productIndex],
      quantity,
      weight,
      margin: Math.random() * 30 + 10, // 10% a 40%
      freight: Math.random() * 1000 + 200,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
  });
};

// Calcular totais do pedido
const calculateOrderTotals = (products: Product[]) => {
  const totalWeight = products.reduce((sum, p) => sum + (p.weight * p.quantity), 0);
  const totalValue = products.reduce((sum, p) => sum + p.totalPrice, 0);
  const averageMargin = products.reduce((sum, p) => sum + p.margin, 0) / products.length;

  return { totalWeight, totalValue, averageMargin };
};

// Dados mockados para um vendedor específico (João Silva)
export const mockSellerOrders: Order[] = [
  {
    id: "SELLER-ORD-001",
    orderNumber: "2026-0101",
    clientName: "Distribuidora ABC Ltda",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-21"),
    products: generateMockProducts(3, 1),
  },
  {
    id: "SELLER-ORD-002",
    orderNumber: "2026-0095",
    clientName: "Comercial XYZ S.A.",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-18"),
    updatedAt: new Date("2026-01-20"),
    products: generateMockProducts(2, 2),
    lossReasonDetail: {
      code: "freight",
      description: "Cliente optou por concorrente com melhor prazo de entrega. Nosso prazo era de 15 dias e o concorrente ofereceu 7 dias com frete 20% menor.",
      submittedAt: new Date("2026-01-20T14:30:00"),
    },
  },
  {
    id: "SELLER-ORD-003",
    orderNumber: "2026-0089",
    clientName: "Indústria Tech Corp",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-17"),
    updatedAt: new Date("2026-01-21"),
    products: generateMockProducts(4, 3),
  },
  {
    id: "SELLER-ORD-004",
    orderNumber: "2026-0082",
    clientName: "Atacadista Nacional",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-19"),
    products: generateMockProducts(5, 4),
    // Pedido perdido SEM justificativa - precisa preencher
  },
  {
    id: "SELLER-ORD-005",
    orderNumber: "2026-0075",
    clientName: "Varejo Premium",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-21"),
    products: generateMockProducts(3, 5),
  },
  {
    id: "SELLER-ORD-006",
    orderNumber: "2026-0068",
    clientName: "Importadora Delta",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-16"),
    products: generateMockProducts(2, 6),
    lossReasonDetail: {
      code: "price",
      description: "Preço acima do orçamento do cliente. Solicitaram desconto de 15% mas nosso máximo aprovado pela diretoria foi 8%. Cliente decidiu por fornecedor com preço 12% menor.",
      submittedAt: new Date("2026-01-16T16:45:00"),
    },
  },
  {
    id: "SELLER-ORD-007",
    orderNumber: "2026-0061",
    clientName: "Rede Super Mercados",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-08"),
    updatedAt: new Date("2026-01-21"),
    products: generateMockProducts(6, 7),
  },
  {
    id: "SELLER-ORD-008",
    orderNumber: "2026-0055",
    clientName: "Construtora Mega",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-12"),
    products: generateMockProducts(4, 8),
    // Pedido perdido SEM justificativa - precisa preencher
  },
  {
    id: "SELLER-ORD-009",
    orderNumber: "2026-0048",
    clientName: "Grupo Alimentício Brasil",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-10"),
    products: generateMockProducts(3, 9),
    lossReasonDetail: {
      code: "margin",
      description: "Margem solicitada pelo cliente não foi aprovada internamente. Cliente pediu margem adicional de 5% que comprometeria nossa rentabilidade mínima. Após análise da diretoria comercial, proposta foi recusada.",
      submittedAt: new Date("2026-01-10T10:20:00"),
    },
  },
  {
    id: "SELLER-ORD-010",
    orderNumber: "2026-0042",
    clientName: "Distribuidora Norte",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-21"),
    products: generateMockProducts(2, 10),
  },
];

// Calcular totais para cada pedido
mockSellerOrders.forEach(order => {
  const totals = calculateOrderTotals(order.products);
  order.totalWeight = totals.totalWeight;
  order.totalValue = totals.totalValue;
  order.averageMargin = totals.averageMargin;
});

// Informações do vendedor logado
export const mockLoggedSeller = {
  id: "SELL-001",
  name: "João Silva",
  email: "joao.silva@workapool.com",
};

// Estatísticas do vendedor
export const calculateSellerStats = (orders: Order[]) => {
  const totalOrders = orders.length;
  const negotiatingOrders = orders.filter(o => o.status === 'negotiating').length;
  const lostOrders = orders.filter(o => o.status === 'lost').length;
  const lostWithoutReason = orders.filter(
    o => o.status === 'lost' && !o.lossReasonDetail
  ).length;

  const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
  const negotiatingValue = orders
    .filter(o => o.status === 'negotiating')
    .reduce((sum, o) => sum + o.totalValue, 0);

  return {
    totalOrders,
    negotiatingOrders,
    lostOrders,
    lostWithoutReason,
    totalValue,
    negotiatingValue,
  };
};
