# Arquitetura de Features - WorkaPool Frontend

## 📁 Nova Estrutura

```
src/
├── features/                    # Módulos de funcionalidades
│   ├── caminhoes/              # Feature de caminhões
│   │   ├── components/         # Componentes específicos
│   │   ├── services/          # Serviços/hooks da feature
│   │   ├── types/             # Types específicos
│   │   ├── pages/             # Páginas da feature
│   │   └── index.ts           # Exports da feature
│   │
│   ├── cargas/                # Feature de cargas
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── clientes/              # Feature de clientes
│   ├── estoque/               # Feature de estoque
│   └── metas/                 # Feature de metas
│
├── shared/                     # Código compartilhado
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Biblioteca de componentes
│   │   ├── charts/           # Componentes de gráficos
│   │   ├── navBar/           # Navegação
│   │   └── layout/           # Layouts
│   │
│   ├── services/             # Serviços compartilhados
│   │   ├── apiBase.ts        # Cliente HTTP base
│   │   └── utils.ts          # Utilitários de API
│   │
│   ├── types/                # Types globais
│   ├── utils/                # Utilitários compartilhados
│   ├── hooks/                # Hooks compartilhados
│   └── index.ts              # Exports compartilhados
│
├── pages/                     # Páginas principais
├── routes/                    # Configuração de rotas
├── auth/                      # Autenticação
└── app/                       # Configurações da aplicação
```

## 🚀 Vantagens

1. **Modularidade**: Cada feature é independente
2. **Escalabilidade**: Fácil adicionar novas features
3. **Manutenibilidade**: Código relacionado fica junto
4. **Testabilidade**: Testes por feature
5. **Performance**: Tree-shaking mais eficiente

## 📝 Como Criar uma Nova Feature

### 1. Estrutura Base
```bash
src/features/[nomeFeature]/
├── components/
│   ├── [Feature]List.tsx
│   ├── [Feature]Form.tsx
│   ├── [Feature]Detail.tsx
│   └── index.ts
├── services/
│   ├── use[Feature]Service.ts
│   └── index.ts
├── types/
│   ├── [feature].ts
│   └── index.ts
├── pages/
│   ├── [Feature]Page.tsx
│   └── index.ts
└── index.ts
```

### 2. Template de index.ts da Feature
```typescript
// src/features/[feature]/index.ts
export * from './components'
export * from './services'
export * from './types'
export * from './pages'
```

### 3. Imports Padronizados
```typescript
// Para componentes UI
import { Button } from '@/shared/components/ui/button'

// Para serviços compartilhados
import { apiBase } from '@/shared/services/apiBase'

// Para types compartilhados
import { ApiResponse } from '@/shared/types'

// Para utilitários
import { formatDate } from '@/shared/utils'

// Para components da própria feature
import { FeatureForm } from '../components'

// Para types da própria feature
import { FeatureType } from '../types'
```

## 🔧 Convenções

- **Componentes**: PascalCase (ex: `UserForm.tsx`)
- **Services**: camelCase com prefixo `use` (ex: `useUserService.ts`)
- **Types**: PascalCase (ex: `User.ts`)
- **Arquivos de página**: PascalCase com sufixo `Page` (ex: `UserPage.tsx`)
- **Exports**: Sempre usar `index.ts` para organizar exports

## ⚡ Path Mapping

O projeto usa path mapping configurado no `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Isso permite imports limpos:
- `@/features/caminhoes` → `src/features/caminhoes`
- `@/shared/components/ui` → `src/shared/components/ui`
- `@/shared/services` → `src/shared/services`
