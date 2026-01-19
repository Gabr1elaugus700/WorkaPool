import { Order, Product, Seller } from "../types/orderLoss.types";

// Função auxiliar para gerar dados mockados de produtos
const generateMockProducts = (count: number): Product[] => {
  const productNames = [
    "Produto Premium A",
    "Produto Standard B",
    "Produto Econômico C",
    "Produto Elite D",
    "Produto Master E",
    "Produto Plus F",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `PROD-${Math.random().toString(36).substr(2, 9)}`,
    name: productNames[i % productNames.length],
    quantity: Math.floor(Math.random() * 50) + 10,
    weight: Math.floor(Math.random() * 500) + 50,
    margin: Math.random() * 30 + 10, // 10% a 40%
    freight: Math.random() * 1000 + 200,
    unitPrice: Math.random() * 500 + 100,
    totalPrice: 0, // Será calculado
  })).map(product => ({
    ...product,
    totalPrice: product.unitPrice * product.quantity,
  }));
};

// Função auxiliar para calcular totais do pedido
const calculateOrderTotals = (products: Product[]) => {
  const totalWeight = products.reduce((sum, p) => sum + (p.weight * p.quantity), 0);
  const totalValue = products.reduce((sum, p) => sum + p.totalPrice, 0);
  const averageMargin = products.reduce((sum, p) => sum + p.margin, 0) / products.length;

  return { totalWeight, totalValue, averageMargin };
};

// Dados mockados de pedidos
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    orderNumber: "2025-0001",
    clientName: "Distribuidora ABC Ltda",
    status: "negotiating",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(3),
  },
  {
    id: "ORD-002",
    orderNumber: "2025-0002",
    clientName: "Comercial XYZ S.A.",
    status: "lost",
    seller: "João Silva",
    sellerId: "SELL-001",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-18"),
    products: generateMockProducts(2),
    lossReason: "Cliente optou por concorrente com melhor prazo de entrega. Nosso prazo era de 15 dias e o concorrente ofereceu 7 dias.",
  },
  {
    id: "ORD-003",
    orderNumber: "2025-0003",
    clientName: "Indústria Tech Corp",
    status: "negotiating",
    seller: "Maria Santos",
    sellerId: "SELL-002",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-12"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(4),
  },
  {
    id: "ORD-004",
    orderNumber: "2025-0004",
    clientName: "Atacadista Nacional",
    status: "negotiating",
    seller: "Maria Santos",
    sellerId: "SELL-002",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-14"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(5),
  },
  {
    id: "ORD-005",
    orderNumber: "2025-0005",
    clientName: "Varejo Premium",
    status: "lost",
    seller: "Carlos Oliveira",
    sellerId: "SELL-003",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-08"),
    updatedAt: new Date("2025-01-17"),
    products: generateMockProducts(3),
    lossReason: "Preço acima do orçamento do cliente. Solicitaram desconto de 15% mas nosso máximo aprovado foi 8%.",
  },
  {
    id: "ORD-006",
    orderNumber: "2025-0006",
    clientName: "Importadora Delta",
    status: "negotiating",
    seller: "Carlos Oliveira",
    sellerId: "SELL-003",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-16"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(2),
  },
  {
    id: "ORD-007",
    orderNumber: "2025-0007",
    clientName: "Rede Super Mercados",
    status: "negotiating",
    seller: "Ana Paula",
    sellerId: "SELL-004",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-13"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(6),
  },
  {
    id: "ORD-008",
    orderNumber: "2025-0008",
    clientName: "Construtora Mega",
    status: "lost",
    seller: "Ana Paula",
    sellerId: "SELL-004",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-15"),
    products: generateMockProducts(4),
    lossReason: "Projeto cancelado pelo cliente devido a problemas com financiamento.",
  },
  {
    id: "ORD-009",
    orderNumber: "2025-0009",
    clientName: "Grupo Alimentício Brasil",
    status: "negotiating",
    seller: "Roberto Costa",
    sellerId: "SELL-005",
    totalWeight: 0,
    averageMargin: 0,
    totalValue: 0,
    createdAt: new Date("2025-01-17"),
    updatedAt: new Date("2025-01-19"),
    products: generateMockProducts(3),
  },
];

// Calcular totais para cada pedido
mockOrders.forEach(order => {
  const totals = calculateOrderTotals(order.products);
  order.totalWeight = totals.totalWeight;
  order.totalValue = totals.totalValue;
  order.averageMargin = totals.averageMargin;
});

// Agrupar pedidos por vendedor
export const mockSellers: Seller[] = [
  {
    id: "SELL-001",
    name: "João Silva",
    orders: mockOrders.filter(o => o.sellerId === "SELL-001"),
  },
  {
    id: "SELL-002",
    name: "Maria Santos",
    orders: mockOrders.filter(o => o.sellerId === "SELL-002"),
  },
  {
    id: "SELL-003",
    name: "Carlos Oliveira",
    orders: mockOrders.filter(o => o.sellerId === "SELL-003"),
  },
  {
    id: "SELL-004",
    name: "Ana Paula",
    orders: mockOrders.filter(o => o.sellerId === "SELL-004"),
  },
  {
    id: "SELL-005",
    name: "Roberto Costa",
    orders: mockOrders.filter(o => o.sellerId === "SELL-005"),
  },
];

// Calcular KPIs
export const calculateKPIs = (sellers: Seller[]) => {
  const allOrders = sellers.flatMap(s => s.orders);
  const negotiatingOrders = allOrders.filter(o => o.status === 'negotiating');

  const weightInNegotiation = negotiatingOrders.reduce(
    (sum, order) => sum + order.totalWeight, 
    0
  );

  const averageMargin = negotiatingOrders.length > 0
    ? negotiatingOrders.reduce((sum, order) => sum + order.averageMargin, 0) / negotiatingOrders.length
    : 0;

  const activeNegotiations = negotiatingOrders.length;

  return {
    weightInNegotiation,
    averageMargin,
    activeNegotiations,
  };
};
