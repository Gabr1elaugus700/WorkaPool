# Módulo Cargo - Estrutura Refatorada

## 📁 Estrutura de Pastas

```
frontend/src/features/cargo/
├── components/           # Componentes React do módulo
│   ├── CargaDropzone.tsx
│   ├── CargasFechadas.tsx
│   ├── EditarCargaModal.tsx
│   ├── FiltroCargas.tsx
│   ├── NovaCargaModal.tsx
│   ├── PedidoCard.tsx
│   ├── PedidoDropzone.tsx
│   └── index.ts         # Exportações centralizadas
├── pages/               # Páginas/Views do módulo
│   └── ControleDeCargas.tsx
├── services/            # Serviços e chamadas API
│   ├── cargas.service.ts
│   ├── pedidos.service.ts
│   ├── cargasFechadas.service.ts
│   └── index.ts         # Exportações centralizadas
├── types/               # TypeScript types
│   └── cargo.types.ts
└── index.ts             # Exportação principal do módulo
```

## 🔄 Mudanças de Rotas da API

### Antes (Rota Antiga)
```typescript
// Cargas
GET    /api/cargas
POST   /api/Cargas
PUT    /api/Cargas/:id
PATCH  /api/cargas/:id/situacao

// Pedidos
GET    /api/pedidosFechados/:codRep
GET    /api/pedidosEmCargas?codCar=:codCar
PUT    /api/pedidoToCarga/:numPed
POST   /api/Cargas/carga-pedidos/:codCar

// Cargas Fechadas
GET    /api/cargas/pedidosCargaFechada
```

### Depois (Rota Nova)
```typescript
// Cargas
GET    /api/cargo
POST   /api/cargo
PUT    /api/cargo/:id
PATCH  /api/cargo/:id/situacao

// Pedidos
GET    /api/cargo/pedidos-fechados/:codRep
GET    /api/cargo/:codCar/pedidos
PUT    /api/cargo/pedido/:numPed
POST   /api/cargo/carga-pedidos/:codCar

// Cargas Fechadas
GET    /api/cargo/cargas-fechadas
```

## 📦 Imports

### Antes
```typescript
import { Pedido, Carga } from "@/types/cargas";
import { fetchPedidosFechados } from "@/services/usePedidosFechados";
import PedidoCard from "@/components/cargas/PedidoCard";
import { NovaCargaModal } from "@/components/cargas/NovaCargaModal";
```

### Depois
```typescript
import {
  Pedido,
  Carga,
  PedidoCard,
  NovaCargaModal,
  fetchPedidosFechados,
  // ... outros imports
} from "@/features/cargo";
```

## 🔧 Serviços Renomeados

| Antes | Depois |
|---|---|
| `fetchPedidoToCarga` | `updatePedidoCarga` |
| `fetchUpdateSitCar` | `updateSituacaoCarga` |
| `useCargas.ts` | `cargas.service.ts` |
| `usePedidosFechados.ts` | `pedidos.service.ts` |

## ✅ Benefícios da Refatoração

1. **Organização**: Todo código relacionado a cargas em um único lugar
2. **Manutenibilidade**: Mais fácil encontrar e modificar código
3. **Escalabilidade**: Estrutura que suporta crescimento do módulo
4. **Imports limpos**: Exportações centralizadas reduzem complexidade
5. **Consistência**: Padronização de nomenclatura de rotas

## 🚀 Como Usar

```typescript
// Importar página
import { ControleDeCargas } from "@/features/cargo";

// Importar componentes específicos
import { PedidoCard, CargaDropzone } from "@/features/cargo";

// Importar serviços
import { fetchCargas, updatePedidoCarga } from "@/features/cargo";

// Importar tipos
import type { Carga, Pedido } from "@/features/cargo";
```

## 📝 Notas

- A página antiga `src/pages/controleDeCargas.tsx` foi atualizada para usar os novos imports
- Componentes antigos em `src/components/cargas/` podem ser depreciados após validação
- Services antigos em `src/services/` podem ser removidos após testes
- Types antigos em `src/types/cargas.ts` mantidos para retrocompatibilidade temporária
