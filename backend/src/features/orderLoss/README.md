# API de Pedidos Perdidos (Order Loss)

Esta API gerencia pedidos perdidos e em negociação, integrando dados do banco SAPIENS (SQL Server) com o banco local (PostgreSQL).

## Estrutura da Feature

```
orderLoss/
├── entities/              # Entidades de domínio
│   ├── Order.ts          # Entidade Order com status e métodos
│   ├── OrderProduct.ts   # Produtos do pedido
│   └── LossReason.ts     # Motivo de perda do pedido
├── http/
│   ├── controllers/      # Controllers REST
│   │   └── OrdersController.ts
│   ├── routes/           # Definição de rotas
│   │   └── ordersRoutes.ts
│   └── schemas/          # Validação Zod
│       └── orderSchemas.ts
├── repositories/         # Camada de dados
│   ├── IOrdersRepository.ts
│   └── OrdersRepository.ts
└── useCases/            # Casos de uso (lógica de negócio)
    ├── GetLostOrdersUseCase.ts
    ├── CreateOrderUseCase.ts
    ├── UpdateOrderStatusUseCase.ts
    ├── AddLossReasonUseCase.ts
    ├── GetAllOrdersUseCase.ts
    └── GetOrderByIdUseCase.ts
```

## Endpoints

### 1. Buscar Pedidos Perdidos do SAPIENS
```
GET /api/orders/lost-sapiens
```

**Query Parameters:**
- `startDate` (opcional): Data inicial no formato 'DD-MM-YYYY'
- `endDate` (opcional): Data final no formato 'DD-MM-YYYY'  
- `codRep` (opcional): Código do representante/vendedor

**Resposta:**
```json
[
  {
    "DATA": "2026-01-15T00:00:00.000Z",
    "NUMPED": "12345",
    "SITUAÇÃO": "5",
    "CODREP": 101,
    "APEREP": "João Silva",
    "CODCLI": 5001,
    "FANTASIA": "Cliente XYZ",
    "CIDADE": "São Paulo - SP",
    "CODPRO": "PROD001",
    "PRODUTO": "Produto ABC",
    "QTDPED": 100,
    "PREUNI": 25.50,
    "VLRFINAL": 2550.00,
    "MARGEM LUCRO": 15.5,
    "VLRFRETE": 150.00,
    "IPI": 50.00,
    "ICMS": 125.00
  }
]
```

### 2. Criar Pedido Localmente
```
POST /api/orders
```

**Body:**
```json
{
  "orderNumber": "12345",
  "status": "NEGOTIATING",
  "sellerId": "uuid-do-vendedor"
}
```

**Resposta:**
```json
{
  "id": "uuid-gerado",
  "orderNumber": "12345",
  "status": "NEGOTIATING",
  "sellerId": "uuid-do-vendedor",
  "createdAt": "2026-01-28T12:00:00.000Z",
  "updatedAt": "2026-01-28T12:00:00.000Z"
}
```

### 3. Listar Todos os Pedidos Locais
```
GET /api/orders
```

**Resposta:** Array de pedidos

### 4. Buscar Pedido por ID
```
GET /api/orders/:id
```

**Resposta:**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "12345",
    "status": "NEGOTIATING",
    "sellerId": "uuid-vendedor",
    "createdAt": "2026-01-28T12:00:00.000Z",
    "updatedAt": "2026-01-28T12:00:00.000Z"
  },
  "products": [
    {
      "id": "uuid",
      "orderId": "uuid-do-pedido",
      "codprod": "PROD001",
      "description": "Produto ABC",
      "createdAt": "2026-01-28T12:00:00.000Z"
    }
  ],
  "lossReason": {
    "id": "uuid",
    "orderId": "uuid-do-pedido",
    "code": "FREIGHT",
    "description": "Frete muito alto para a região",
    "submittedBy": "uuid-vendedor",
    "submittedAt": "2026-01-28T12:00:00.000Z"
  }
}
```

### 5. Atualizar Status do Pedido
```
PATCH /api/orders/:id/status
```

**Body:**
```json
{
  "status": "LOST"
}
```

**Status Permitidos:**
- `NEGOTIATING` - Em negociação
- `LOST` - Perdido
- `WON` - Ganho
- `CANCELLED` - Cancelado

### 6. Adicionar Motivo de Perda
```
POST /api/orders/loss-reason
```

**Body:**
```json
{
  "orderId": "uuid-do-pedido",
  "code": "FREIGHT",
  "description": "Frete muito alto para essa região, cliente não aceitou",
  "submittedBy": "uuid-do-vendedor"
}
```

**Códigos de Motivo de Perda:**
- `FREIGHT` - Frete
- `PRICE` - Preço
- `MARGIN` - Margem
- `STOCK` - Estoque
- `OTHER` - Outro

**Nota:** Este endpoint automaticamente atualiza o status do pedido para `LOST`.

## Modelos de Dados

### Order (PostgreSQL)
```typescript
{
  id: string (uuid)
  orderNumber: string
  status: OrderStatus (NEGOTIATING | LOST | WON | CANCELLED)
  sellerId: string (FK para User)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### OrderProduct (PostgreSQL)
```typescript
{
  id: string (uuid)
  orderId: string (FK para Order)
  codprod: string
  description?: string
  createdAt: DateTime
}
```

### LossReason (PostgreSQL)
```typescript
{
  id: string (uuid)
  orderId: string (FK única para Order)
  code: LossReasonCode (FREIGHT | PRICE | MARGIN | STOCK | OTHER)
  description: string
  submittedBy: string
  submittedAt: DateTime
}
```

## Consulta SQL no SAPIENS

A consulta base para buscar pedidos perdidos:

```sql
SELECT  ped.datemi [DATA]
        ,ped.numped [NUMPED]
        ,ped.sitped [SITUAÇÃO]
        ,ped.codven [CODREP]
        ,rep.aperep [APEREP]
        ,ped.codcli [CODCLI]
        ,cli.apecli [FANTASIA]
        ,(cli.cidcli + ' - ' + cli.sigufs) [CIDADE]
        ,ipd.codpro [CODPRO]
        ,ISNULL(grp.desgrp, 'OUTROS PRODUTOS')  [PRODUTO]
        ,ipd.qtdped [QTDPED]
        ,ipd.preuni [PREUNI]
        ,ipd.usu_vlrfin [VLRFINAL]
        ,ipd.usu_mgmluc [MARGEM LUCRO]
        ,ipd.usu_vlrfre [VLRFRETE]
        ,ipd.usu_vlripi [IPI]
        ,ipd.usu_vlricm [ICMS]
FROM e120ped ped
LEFT JOIN e120ipd ipd 
          ON ipd.codemp = ped.codemp
        AND ipd.codfil = ped.codfil
        AND ipd.numped = ped.numped	   
LEFT JOIN e090rep rep 
        ON rep.codrep = ped.codven	
LEFT JOIN e085cli cli 	
        ON cli.codcli = ped.codcli
LEFT JOIN e085hcl hcl 
          ON hcl.codemp = ped.codemp
        AND hcl.codfil = ped.codfil
        AND hcl.codcli = ped.codcli
LEFT JOIN poolbi.dbo.grppro grp 
        ON grp.codpro = ipd.codpro
WHERE ped.sitped = '5'
      AND ped.datemi >= '01-01-2026'
```

**Filtros Aplicáveis:**
- `sitped = '5'` - Pedidos perdidos
- `datemi` - Data de emissão
- `codven` - Código do vendedor (CODREP)

## Configuração

### Variáveis de Ambiente (.env)

Para conexão com SAPIENS (SQL Server):
```env
DB_HOST=seu-servidor
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=sapiens
```

Para conexão com PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/workpool?schema=public"
```

## Fluxo de Uso

1. **Consultar pedidos perdidos do SAPIENS**
   ```
   GET /api/orders/lost-sapiens?codRep=101&startDate=01-01-2026
   ```

2. **Criar pedido localmente** (se necessário registrar)
   ```
   POST /api/orders
   ```

3. **Adicionar motivo de perda** (marca automaticamente como LOST)
   ```
   POST /api/orders/loss-reason
   ```

4. **Consultar detalhes completos**
   ```
   GET /api/orders/:id
   ```

## Observações

- O banco SAPIENS é somente leitura (consultas)
- Os pedidos perdidos são armazenados localmente para análise
- O campo `CODREP` identifica o vendedor responsável
- Um pedido só pode ter um motivo de perda
- Ao adicionar motivo de perda, o status é automaticamente alterado para `LOST`
