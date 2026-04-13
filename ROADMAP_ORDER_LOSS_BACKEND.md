# 🚀 Roadmap Backend - Feature Order Loss

> **Data de Criação:** 23/01/2026  
> **Projeto:** WorkaPool - Sistema de Gestão de Pedidos Perdidos  
> **Status:** 🟡 Planejamento
> **Atualização Técnica:** 13/04/2026 - Contratos de API alinhados, auth/roles aplicados em rotas críticas, filtros de datas validados, query Sapiens parametrizada, testes iniciais adicionados.

---

## Atualização de Execução (13/04/2026)

Itens implementados neste ciclo:
- Contrato de rota de cargo corrigido para `PATCH /api/cargo/:codCar/situacao`
- Autenticação/autorização aplicada em rotas críticas de `cargo` e `orders`
- Validação de filtros em `GET /api/orders/lost-sapiens` com `startDate`/`endDate`
- Hardening de consulta SQL Server com parâmetros (`@startDate`, `@endDate`, `@codRep`)
- Boundary do domínio `pedidos` mantido como interno, com contrato compartilhado para filtros
- Testes adicionados para autorização e validação de filtros

Pendências para próximos ciclos:
- Completar testes de integração de fluxos críticos de fechamento de carga em ambiente com banco controlado
- Revisar e unificar documentação Swagger para refletir os contratos atuais
- Evoluir regras de ownership para cenários vendedor/gestor por endpoint de `orders`

---

## 📊 Contexto

### Telas Desenvolvidas no Frontend

#### 1. **OrderLossView** (Visão do Gestor)
- Layout Kanban com colunas por vendedor
- KPIs agregados (peso total, margem média, negociações ativas)
- Visualização de todos os pedidos da equipe
- Apenas leitura e análise gerencial

#### 2. **SellerOrdersView** (Visão do Vendedor)
- Lista de pedidos próprios ordenada por data
- Filtros por status (todos, negociação, perdidos)
- Estatísticas individuais do vendedor
- Funcionalidade de submeter justificativas de perda
- Códigos de motivo: Frete, Preço, Margem, Estoque, Outro

---

## 🗂️ FASE 1: Modelagem de Dados

### 1.3. Seeds (Opcional)

```typescript
// prisma/seeds/orderLossSeed.ts
// Criar dados de teste para desenvolvimento
```

**📌 Tempo Estimado:** 2-4 horas

---

## 🔧 FASE 2: Estrutura Backend

### 2.1. Arquitetura de Pastas

```
backend/src/features/orderLoss/
├── controllers/
│   ├── orderLossController.ts      # Endpoints do gestor
│   └── sellerOrdersController.ts   # Endpoints do vendedor
├── services/
│   ├── orderLossService.ts         # Lógica de negócio - gestor
│   └── sellerOrdersService.ts      # Lógica de negócio - vendedor
├── repositories/
│   ├── orderRepository.ts          # Queries do Prisma
│   └── lossReasonRepository.ts     # Queries de justificativas
├── validators/
│   ├── orderQuerySchema.ts         # Validação de query params
│   └── lossReasonSchema.ts         # Validação de justificativa
├── types/
│   └── orderLoss.types.ts          # Tipos e interfaces
├── routes/
│   ├── orderLossRoutes.ts          # Rotas do gestor
│   └── sellerOrdersRoutes.ts       # Rotas do vendedor
└── utils/
    └── orderCalculations.ts        # Helpers de cálculo
```

### 2.2. Tipos TypeScript

```typescript
// types/orderLoss.types.ts
export interface OrderDTO {
  id: string;
  orderNumber: string;
  clientName: string;
  status: OrderStatus;
  seller: {
    id: string;
    name: string;
  };
  totalWeight: number;
  averageMargin: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  products: OrderProductDTO[];
  lossReason?: LossReasonDTO;
}

export interface KPIData {
  weightInNegotiation: number;
  averageMargin: number;
  activeNegotiations: number;
}

export interface SellerStats {
  totalOrders: number;
  negotiatingOrders: number;
  lostOrders: number;
  lostWithoutReason: number;
  totalValue: number;
  negotiatingValue: number;
}
```

**📌 Tempo Estimado:** 3-5 horas

---

## 🛣️ FASE 3: Endpoints da API

### 3.1. Rotas do Gestor

#### **GET** `/api/order-loss/overview`
**Descrição:** Retorna KPIs e pedidos agrupados por vendedor (Kanban)  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** Apenas MANAGER/ADMIN  

**Response:**
```json
{
  "kpis": {
    "weightInNegotiation": 15000.50,
    "averageMargin": 24.5,
    "activeNegotiations": 12
  },
  "sellers": [
    {
      "id": "uuid",
      "name": "João Silva",
      "orders": [...]
    }
  ]
}
```

#### **GET** `/api/order-loss/orders/:id`
**Descrição:** Detalhes completos de um pedido  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** MANAGER/ADMIN  

**Response:**
```json
{
  "order": {...},
  "products": [...],
  "lossReason": {...}
}
```

---

### 3.2. Rotas do Vendedor

#### **GET** `/api/seller/orders`
**Descrição:** Lista pedidos do vendedor logado  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** SELLER (apenas seus pedidos)  

**Query Params:**
- `status`: `negotiating` | `lost` | `all` (default: `all`)
- `page`: número (default: `1`)
- `limit`: número (default: `20`, max: `100`)

**Response:**
```json
{
  "orders": [...],
  "stats": {
    "totalOrders": 10,
    "negotiatingOrders": 4,
    "lostOrders": 6,
    "lostWithoutReason": 3,
    "totalValue": 125000.00,
    "negotiatingValue": 80000.00
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

#### **GET** `/api/seller/orders/:id`
**Descrição:** Detalhes de um pedido específico  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** SELLER (apenas seus pedidos)  

**Response:**
```json
{
  "order": {...},
  "products": [...],
  "lossReason": {...}
}
```

#### **POST** `/api/seller/orders/:id/loss-reason`
**Descrição:** Submeter justificativa de perda  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** SELLER (apenas seus pedidos)  

**Request Body:**
```json
{
  "code": "freight",
  "description": "Cliente optou por concorrente com prazo menor..."
}
```

**Validações:**
- `code`: obrigatório, enum válido
- `description`: obrigatório, 10-500 caracteres

**Response:**
```json
{
  "success": true,
  "lossReason": {
    "id": "uuid",
    "code": "freight",
    "description": "...",
    "submittedAt": "2026-01-23T10:30:00Z"
  }
}
```

#### **PUT** `/api/seller/orders/:id/loss-reason`
**Descrição:** Atualizar justificativa existente (opcional)  
**Autenticação:** ✅ Requer token JWT  
**Permissão:** SELLER (apenas seus pedidos)  

**Request/Response:** Igual ao POST

**📌 Tempo Estimado:** 3-4 horas

---

## 🔐 FASE 4: Autenticação e Autorização

### 4.1. Middlewares

```typescript
// middlewares/authMiddleware.ts
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Token não fornecido');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Não autenticado' });
  }
};

// middlewares/roleMiddleware.ts
export const requireRole = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

// middlewares/ownershipMiddleware.ts
export const requireOrderOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderRepository.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Gestor pode ver qualquer pedido
    if (req.user.role === 'MANAGER' || req.user.role === 'ADMIN') {
      return next();
    }
    
    // Vendedor só pode ver seus próprios pedidos
    if (order.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar permissão' });
  }
};
```

### 4.2. Aplicação nas Rotas

```typescript
// routes/orderLossRoutes.ts
import { Router } from 'express';
import { authenticateUser, requireRole } from '@/middlewares';
import { orderLossController } from '../controllers/orderLossController';

const router = Router();

router.get('/overview', 
  authenticateUser, 
  requireRole(['MANAGER', 'ADMIN']), 
  orderLossController.getOverview
);

router.get('/orders/:id', 
  authenticateUser, 
  requireRole(['MANAGER', 'ADMIN']), 
  orderLossController.getOrderDetails
);

export default router;

// routes/sellerOrdersRoutes.ts
import { Router } from 'express';
import { authenticateUser, requireRole, requireOrderOwnership } from '@/middlewares';
import { sellerOrdersController } from '../controllers/sellerOrdersController';

const router = Router();

router.get('/orders', 
  authenticateUser, 
  requireRole(['SELLER']),
  sellerOrdersController.getOrders
);

router.get('/orders/:id', 
  authenticateUser, 
  requireRole(['SELLER']),
  requireOrderOwnership,
  sellerOrdersController.getOrderDetails
);

router.post('/orders/:id/loss-reason', 
  authenticateUser, 
  requireRole(['SELLER']),
  requireOrderOwnership,
  sellerOrdersController.submitLossReason
);

export default router;
```

**📌 Tempo Estimado:** 3-4 horas

---

## ✅ FASE 5: Validações com Zod

### 5.1. Schemas

```typescript
// validators/lossReasonSchema.ts
import { z } from 'zod';

export const lossReasonSchema = z.object({
  code: z.enum(['freight', 'price', 'margin', 'stock', 'other'], {
    errorMap: () => ({ message: 'Código de motivo inválido' })
  }),
  description: z.string()
    .min(10, 'Justificativa deve ter no mínimo 10 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres')
    .trim()
    .refine(val => val.length >= 10, {
      message: 'Justificativa não pode conter apenas espaços'
    })
});

// validators/orderQuerySchema.ts
export const orderQuerySchema = z.object({
  status: z.enum(['negotiating', 'lost', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

// validators/orderIdSchema.ts
export const orderIdSchema = z.object({
  id: z.string().uuid('ID do pedido inválido')
});
```

### 5.2. Middleware de Validação

```typescript
// middlewares/validate.ts
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
```

**📌 Tempo Estimado:** 2-3 horas

---

## 💼 FASE 6: Services (Lógica de Negócio)

### 6.1. OrderLossService

```typescript
// services/orderLossService.ts
export class OrderLossService {
  constructor(
    private orderRepository: OrderRepository,
    private lossReasonRepository: LossReasonRepository
  ) {}

  async getOverview() {
    // 1. Buscar todos os pedidos com produtos e vendedores
    const orders = await this.orderRepository.findAll();
    
    // 2. Calcular KPIs agregados
    const kpis = this.calculateKPIs(orders);
    
    // 3. Agrupar por vendedor
    const sellers = this.groupBySeller(orders);
    
    return { kpis, sellers };
  }
  
  private calculateKPIs(orders: Order[]) {
    const negotiating = orders.filter(o => o.status === 'NEGOTIATING');
    
    return {
      weightInNegotiation: negotiating.reduce((sum, o) => sum + o.totalWeight, 0),
      averageMargin: negotiating.length > 0
        ? negotiating.reduce((sum, o) => sum + o.averageMargin, 0) / negotiating.length
        : 0,
      activeNegotiations: negotiating.length
    };
  }
  
  private groupBySeller(orders: Order[]) {
    const sellersMap = new Map();
    
    orders.forEach(order => {
      if (!sellersMap.has(order.sellerId)) {
        sellersMap.set(order.sellerId, {
          id: order.seller.id,
          name: order.seller.name,
          orders: []
        });
      }
      sellersMap.get(order.sellerId).orders.push(order);
    });
    
    return Array.from(sellersMap.values());
  }
  
  async getOrderDetails(orderId: string) {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    
    if (!order) {
      throw new Error('Pedido não encontrado');
    }
    
    return order;
  }
}
```

### 6.2. SellerOrdersService

```typescript
// services/sellerOrdersService.ts
export class SellerOrdersService {
  constructor(
    private orderRepository: OrderRepository,
    private lossReasonRepository: LossReasonRepository
  ) {}

  async getSellerOrders(sellerId: string, filters: OrderFilters) {
    const { status, page, limit } = filters;
    
    // 1. Buscar pedidos com paginação
    const { orders, total } = await this.orderRepository.findBySeller(
      sellerId, 
      status,
      { page, limit }
    );
    
    // 2. Calcular estatísticas
    const stats = await this.calculateSellerStats(sellerId);
    
    // 3. Preparar resposta
    return {
      orders,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  private async calculateSellerStats(sellerId: string) {
    const allOrders = await this.orderRepository.findBySeller(sellerId, 'all');
    
    const negotiating = allOrders.filter(o => o.status === 'NEGOTIATING');
    const lost = allOrders.filter(o => o.status === 'LOST');
    const lostWithoutReason = lost.filter(o => !o.lossReason);
    
    return {
      totalOrders: allOrders.length,
      negotiatingOrders: negotiating.length,
      lostOrders: lost.length,
      lostWithoutReason: lostWithoutReason.length,
      totalValue: allOrders.reduce((sum, o) => sum + o.totalValue, 0),
      negotiatingValue: negotiating.reduce((sum, o) => sum + o.totalValue, 0)
    };
  }
  
  async submitLossReason(orderId: string, data: LossReasonInput, sellerId: string) {
    // 1. Validar que o pedido existe
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('Pedido não encontrado');
    }
    
    // 2. Validar que pertence ao vendedor
    if (order.sellerId !== sellerId) {
      throw new Error('Acesso negado');
    }
    
    // 3. Validar que está perdido
    if (order.status !== 'LOST') {
      throw new Error('Apenas pedidos perdidos podem ter justificativa');
    }
    
    // 4. Criar ou atualizar justificativa
    const existingReason = await this.lossReasonRepository.findByOrderId(orderId);
    
    if (existingReason) {
      return await this.lossReasonRepository.update(orderId, {
        ...data,
        submittedBy: sellerId,
        submittedAt: new Date()
      });
    } else {
      return await this.lossReasonRepository.create({
        orderId,
        ...data,
        submittedBy: sellerId
      });
    }
  }
}
```

**📌 Tempo Estimado:** 4-6 horas

---

## 📝 FASE 7: Repositories (Prisma)

### 7.1. OrderRepository

```typescript
// repositories/orderRepository.ts
import { PrismaClient, OrderStatus } from '@prisma/client';

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return await this.prisma.order.findMany({
      include: {
        products: true,
        seller: {
          select: { id: true, name: true, email: true }
        },
        lossReason: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async findBySeller(
    sellerId: string, 
    status?: string,
    pagination?: { page: number; limit: number }
  ) {
    const where = {
      sellerId,
      ...(status && status !== 'all' ? { status: status.toUpperCase() as OrderStatus } : {})
    };
    
    if (pagination) {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            products: true,
            lossReason: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.order.count({ where })
      ]);
      
      return { orders, total };
    }
    
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        products: true,
        lossReason: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders;
  }
  
  async findById(id: string) {
    return await this.prisma.order.findUnique({
      where: { id },
      include: {
        products: true,
        seller: true,
        lossReason: true
      }
    });
  }
  
  async findByIdWithDetails(id: string) {
    return await this.findById(id);
  }
  
  async updateTotals(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { products: true }
    });
    
    if (!order) return null;
    
    const totalWeight = order.products.reduce(
      (sum, p) => sum + (Number(p.weight) * p.quantity), 
      0
    );
    
    const totalValue = order.products.reduce(
      (sum, p) => sum + Number(p.totalPrice), 
      0
    );
    
    const averageMargin = order.products.length > 0
      ? order.products.reduce((sum, p) => sum + Number(p.margin), 0) / order.products.length
      : 0;
    
    return await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalWeight,
        totalValue,
        averageMargin
      }
    });
  }
}
```

### 7.2. LossReasonRepository

```typescript
// repositories/lossReasonRepository.ts
import { PrismaClient } from '@prisma/client';

export class LossReasonRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateLossReasonDTO) {
    return await this.prisma.lossReason.create({
      data
    });
  }
  
  async update(orderId: string, data: UpdateLossReasonDTO) {
    return await this.prisma.lossReason.update({
      where: { orderId },
      data
    });
  }
  
  async findByOrderId(orderId: string) {
    return await this.prisma.lossReason.findUnique({
      where: { orderId }
    });
  }
  
  async deleteByOrderId(orderId: string) {
    return await this.prisma.lossReason.delete({
      where: { orderId }
    });
  }
}
```

**📌 Tempo Estimado:** 3-4 horas

---

## 🧪 FASE 8: Testes

### 8.1. Configuração de Testes

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ]
};
```

### 8.2. Testes Unitários - Services

```typescript
// services/__tests__/sellerOrdersService.test.ts
describe('SellerOrdersService', () => {
  let service: SellerOrdersService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockLossReasonRepository: jest.Mocked<LossReasonRepository>;
  
  beforeEach(() => {
    mockOrderRepository = createMockOrderRepository();
    mockLossReasonRepository = createMockLossReasonRepository();
    service = new SellerOrdersService(mockOrderRepository, mockLossReasonRepository);
  });
  
  describe('submitLossReason', () => {
    it('should submit loss reason successfully', async () => {
      // Arrange
      const orderId = 'order-123';
      const sellerId = 'seller-456';
      const data = {
        code: 'freight',
        description: 'Cliente optou por concorrente com prazo menor'
      };
      
      mockOrderRepository.findById.mockResolvedValue({
        id: orderId,
        sellerId,
        status: 'LOST'
      } as any);
      
      mockLossReasonRepository.findByOrderId.mockResolvedValue(null);
      mockLossReasonRepository.create.mockResolvedValue({ id: '789', ...data } as any);
      
      // Act
      const result = await service.submitLossReason(orderId, data, sellerId);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.code).toBe('freight');
      expect(mockLossReasonRepository.create).toHaveBeenCalledWith({
        orderId,
        ...data,
        submittedBy: sellerId
      });
    });
    
    it('should reject if order does not belong to seller', async () => {
      // Arrange
      const orderId = 'order-123';
      const sellerId = 'seller-456';
      const wrongSellerId = 'seller-789';
      
      mockOrderRepository.findById.mockResolvedValue({
        id: orderId,
        sellerId: wrongSellerId,
        status: 'LOST'
      } as any);
      
      // Act & Assert
      await expect(
        service.submitLossReason(orderId, { code: 'freight', description: 'test' }, sellerId)
      ).rejects.toThrow('Acesso negado');
    });
    
    it('should reject if order is not lost', async () => {
      // Arrange
      const orderId = 'order-123';
      const sellerId = 'seller-456';
      
      mockOrderRepository.findById.mockResolvedValue({
        id: orderId,
        sellerId,
        status: 'NEGOTIATING'
      } as any);
      
      // Act & Assert
      await expect(
        service.submitLossReason(orderId, { code: 'freight', description: 'test' }, sellerId)
      ).rejects.toThrow('Apenas pedidos perdidos podem ter justificativa');
    });
  });
});
```

### 8.3. Testes de Integração - Endpoints

```typescript
// controllers/__tests__/sellerOrdersController.test.ts
import request from 'supertest';
import app from '@/app';

describe('POST /api/seller/orders/:id/loss-reason', () => {
  let authToken: string;
  let testOrderId: string;
  
  beforeAll(async () => {
    // Setup: criar usuário de teste e fazer login
    authToken = await getTestAuthToken();
    testOrderId = await createTestLostOrder();
  });
  
  it('should submit loss reason successfully', async () => {
    const response = await request(app)
      .post(`/api/seller/orders/${testOrderId}/loss-reason`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: 'freight',
        description: 'Cliente optou por concorrente com prazo de entrega melhor'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.lossReason).toHaveProperty('id');
    expect(response.body.lossReason.code).toBe('freight');
  });
  
  it('should return 400 for invalid code', async () => {
    const response = await request(app)
      .post(`/api/seller/orders/${testOrderId}/loss-reason`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: 'invalid-code',
        description: 'Valid description'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Dados inválidos');
  });
  
  it('should return 400 for short description', async () => {
    const response = await request(app)
      .post(`/api/seller/orders/${testOrderId}/loss-reason`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: 'freight',
        description: 'Curto'
      });
    
    expect(response.status).toBe(400);
  });
  
  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .post(`/api/seller/orders/${testOrderId}/loss-reason`)
      .send({
        code: 'freight',
        description: 'Valid description'
      });
    
    expect(response.status).toBe(401);
  });
});
```

**📌 Tempo Estimado:** 4-6 horas

---

## 📚 FASE 9: Documentação

### 9.1. Swagger/OpenAPI

```typescript
// swagger.ts - adicionar ao arquivo existente

/**
 * @swagger
 * components:
 *   schemas:
 *     LossReasonCode:
 *       type: string
 *       enum: [freight, price, margin, stock, other]
 *     
 *     LossReasonInput:
 *       type: object
 *       required:
 *         - code
 *         - description
 *       properties:
 *         code:
 *           $ref: '#/components/schemas/LossReasonCode'
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *     
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderNumber:
 *           type: string
 *         clientName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [NEGOTIATING, LOST, WON, CANCELLED]
 *         totalWeight:
 *           type: number
 *         averageMargin:
 *           type: number
 *         totalValue:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/seller/orders/{id}/loss-reason:
 *   post:
 *     summary: Submeter justificativa de perda de pedido
 *     tags: [Seller Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LossReasonInput'
 *           example:
 *             code: freight
 *             description: Cliente optou por concorrente com melhor prazo de entrega
 *     responses:
 *       200:
 *         description: Justificativa submetida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 lossReason:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Pedido não encontrado
 */
```

### 9.2. README.md

```markdown
# Feature: Order Loss

## Endpoints

### Gestor
- `GET /api/order-loss/overview` - Visão Kanban
- `GET /api/order-loss/orders/:id` - Detalhes de pedido

### Vendedor
- `GET /api/seller/orders` - Listar meus pedidos
- `GET /api/seller/orders/:id` - Detalhes de pedido
- `POST /api/seller/orders/:id/loss-reason` - Submeter justificativa
- `PUT /api/seller/orders/:id/loss-reason` - Atualizar justificativa

## Autenticação

Todos os endpoints requerem JWT token no header:
```
Authorization: Bearer <token>
```

## Exemplos de Uso

Ver documentação Swagger: `/api-docs`
```

**📌 Tempo Estimado:** 2-3 horas

---

## 🚀 FASE 10: Otimizações

### 10.1. Índices do Banco

✅ Já incluídos no schema Prisma:
- `@@index([sellerId])` - Buscar pedidos por vendedor
- `@@index([status])` - Filtrar por status
- `@@index([createdAt])` - Ordenação por data
- `@@index([code])` - Análise de motivos de perda

### 10.2. Cache (Redis) - Opcional

```typescript
// services/cacheService.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttlSeconds: number = 300) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Uso em OrderLossService
async getOverview() {
  const cacheKey = 'order-loss:overview';
  const cached = await this.cache.get(cacheKey);
  
  if (cached) return cached;
  
  const data = await this.calculateOverview();
  await this.cache.set(cacheKey, data, 300); // 5 min
  
  return data;
}
```

### 10.3. Paginação Eficiente

✅ Já implementada no `OrderRepository.findBySeller`

### 10.4. Query Optimization

```typescript
// Usar select específico ao invés de include completo
const orders = await prisma.order.findMany({
  select: {
    id: true,
    orderNumber: true,
    status: true,
    totalValue: true,
    seller: {
      select: { id: true, name: true }
    },
    _count: {
      select: { products: true }
    }
  }
});
```

**📌 Tempo Estimado:** 2-3 horas

---

## 🎯 FASE 11: Deploy

### 11.1. Variáveis de Ambiente

```env
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/workapool"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=3000

# Opcional
REDIS_URL="redis://localhost:6379"
```

### 11.2. Scripts de Deploy

```json
// package.json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate:deploy": "npx prisma migrate deploy",
    "postinstall": "npx prisma generate",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 11.3. Checklist de Deploy

- [ ] Rodar migrations em produção
- [ ] Validar conexão com banco
- [ ] Testar autenticação
- [ ] Validar permissões de acesso
- [ ] Testar endpoints críticos
- [ ] Configurar logs
- [ ] Configurar monitoramento

### 11.4. Logs Estruturados

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Uso
logger.info('Loss reason submitted', {
  orderId: '123',
  sellerId: '456',
  code: 'freight'
});
```

### 11.5. Monitoramento

```typescript
// Métricas de negócio para tracking
- Total de justificativas por motivo/período
- Tempo médio até justificativa
- Taxa de pedidos sem justificativa
- Pedidos perdidos por vendedor
- Conversão por vendedor
```

**📌 Tempo Estimado:** 2-3 horas

---

## 📋 Checklist Completo de Implementação

### ✅ Banco de Dados
- [ ] Criar enum OrderStatus
- [ ] Criar enum LossReasonCode
- [ ] Criar model Order
- [ ] Criar model OrderProduct
- [ ] Criar model LossReason
- [ ] Estender model User
- [ ] Adicionar índices
- [ ] Criar migration
- [ ] Rodar migration em dev
- [ ] Gerar Prisma Client
- [ ] Testar schema localmente

### ✅ Estrutura Backend
- [ ] Criar estrutura de pastas
- [ ] Definir tipos TypeScript
- [ ] Implementar OrderRepository
- [ ] Implementar LossReasonRepository
- [ ] Implementar OrderLossService
- [ ] Implementar SellerOrdersService
- [ ] Implementar OrderLossController
- [ ] Implementar SellerOrdersController
- [ ] Criar validators (Zod)
- [ ] Criar rotas

### ✅ Autenticação & Autorização
- [ ] Middleware authenticateUser
- [ ] Middleware requireRole
- [ ] Middleware requireOrderOwnership
- [ ] Aplicar middlewares nas rotas
- [ ] Testar permissões

### ✅ Endpoints
- [ ] GET /api/order-loss/overview
- [ ] GET /api/order-loss/orders/:id
- [ ] GET /api/seller/orders
- [ ] GET /api/seller/orders/:id
- [ ] POST /api/seller/orders/:id/loss-reason
- [ ] PUT /api/seller/orders/:id/loss-reason [opcional]

### ✅ Validações
- [ ] Validar input de loss reason
- [ ] Validar query params
- [ ] Validar IDs (UUID)
- [ ] Validar regras de negócio
- [ ] Mensagens de erro claras

### ✅ Testes
- [ ] Testes unitários - OrderLossService
- [ ] Testes unitários - SellerOrdersService
- [ ] Testes unitários - Repositories
- [ ] Testes de integração - Endpoints
- [ ] Testes de autorização
- [ ] Coverage > 80%

### ✅ Documentação
- [ ] Swagger schemas
- [ ] Swagger endpoints
- [ ] README atualizado
- [ ] Exemplos de requests
- [ ] Diagramas de fluxo [opcional]

### ✅ Performance
- [ ] Índices no banco
- [ ] Paginação implementada
- [ ] Query optimization
- [ ] Cache (se necessário)

### ✅ Deploy
- [ ] Variáveis de ambiente
- [ ] Scripts de deploy
- [ ] Rodar migrations em prod
- [ ] Logs estruturados
- [ ] Monitoramento
- [ ] Health checks

---

## ⏱️ Estimativa de Tempo

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Modelagem + Migrations | 2-4h |
| 2 | Estrutura Backend | 3-5h |
| 3 | Endpoints | 3-4h |
| 4 | Auth & Authorization | 3-4h |
| 5 | Validações | 2-3h |
| 6 | Services | 4-6h |
| 7 | Repositories | 3-4h |
| 8 | Testes | 4-6h |
| 9 | Documentação | 2-3h |
| 10 | Otimizações | 2-3h |
| 11 | Deploy | 2-3h |
| **TOTAL** | | **30-45h** |

---

## 🎯 Prioridades de Desenvolvimento

### 🔴 MVP - Mínimo Viável (15-20h)
**Prioridade:** ALTA - Deploy em 1-2 sprints

1. ✅ Criar tabelas (Order, OrderProduct, LossReason)
2. ✅ Migration e Prisma generate
3. ✅ Repositories básicos
4. ✅ GET /api/seller/orders (lista)
5. ✅ POST /api/seller/orders/:id/loss-reason
6. ✅ Validações essenciais
7. ✅ Autenticação JWT
8. ✅ Middleware de ownership

**Resultado:** Vendedor consegue ver e justificar pedidos

### 🟡 Versão Completa (30-35h)
**Prioridade:** MÉDIA - Deploy em 2-3 sprints

9. ✅ GET /api/order-loss/overview (Kanban gestor)
10. ✅ GET /api/order-loss/orders/:id
11. ✅ GET /api/seller/orders/:id
12. ✅ Filtros e paginação
13. ✅ Validações completas
14. ✅ Testes básicos
15. ✅ Swagger documentação

**Resultado:** Sistema completo funcional

### 🟢 Otimizações (40-45h)
**Prioridade:** BAIXA - Melhorias incrementais

16. ✅ Cache Redis
17. ✅ Testes completos (>80% coverage)
18. ✅ Logs estruturados
19. ✅ Monitoramento e métricas
20. ✅ Query optimization avançada

**Resultado:** Sistema otimizado e monitorado

---

## 📊 Métricas de Sucesso

### KPIs Técnicos
- [ ] Coverage de testes > 80%
- [ ] Tempo de resposta < 300ms (p95)
- [ ] Zero erros críticos em produção
- [ ] 99.9% uptime

### KPIs de Negócio
- [ ] 100% de pedidos perdidos com justificativa em 30 dias
- [ ] Redução do tempo de justificativa (meta: < 24h)
- [ ] Aumento na taxa de conversão de pedidos
- [ ] Insights sobre principais motivos de perda

---

## 🔗 Links Úteis

- Prisma Docs: https://www.prisma.io/docs/
- Zod Validation: https://zod.dev/
- JWT Authentication: https://jwt.io/
- Swagger/OpenAPI: https://swagger.io/

---

## 📝 Notas Importantes

> **⚠️ Segurança**
> - Sempre validar ownership de pedidos
> - Nunca expor dados de outros vendedores
> - Sanitizar inputs antes de salvar no banco
> - Rate limiting nos endpoints de escrita

> **💡 Dicas**
> - Começar pelo MVP e iterar
> - Fazer commits atômicos
> - Testar cada endpoint após implementação
> - Documentar enquanto desenvolve

> **🎯 Foco**
> - Priorizar funcionalidade sobre perfeição
> - Código limpo e manutenível
> - Pensar em escalabilidade desde o início
> - Feedback contínuo com usuários

---

**Última Atualização:** 23/01/2026  
**Versão:** 1.0  
**Status:** 📋 Pronto para Execução
