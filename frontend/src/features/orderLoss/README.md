# Order Loss - Gestão de Pedidos Perdidos e em Negociação

## 📋 Descrição

Feature para gestão e acompanhamento de pedidos em negociação e pedidos perdidos, organizada em um layout Kanban por vendedor.

## 🎯 Funcionalidades

### KPI Cards
- **Peso em Negociação**: Total de peso (kg) dos pedidos em andamento
- **Margem Média**: Percentual médio de margem das negociações ativas
- **Negociações em Andamento**: Quantidade de pedidos ativos

### Kanban Board
- Visualização por vendedor (cada vendedor é uma coluna)
- Cards de pedidos com indicadores visuais:
  - **Barra amarela**: Pedidos em negociação
  - **Barra vermelha**: Pedidos perdidos
- Informações rápidas: cliente, valor, peso, margem

### Modal de Detalhes
Ao clicar em um card, abre um modal com:
- Resumo geral (valor total, margem, peso, frete)
- Lista completa de produtos
- Detalhes de cada produto (quantidade, peso, margem, frete, volume)
- **Justificativa de perda** (apenas para pedidos perdidos)
- Datas de criação e atualização

## 📁 Estrutura de Arquivos

```
orderLoss/
├── components/
│   ├── KPICards.tsx           # Cards de indicadores no topo
│   ├── KanbanBoard.tsx         # Board com colunas de vendedores
│   ├── OrderCard.tsx           # Card individual de pedido
│   └── OrderDetailsModal.tsx   # Modal com detalhes completos
├── services/
│   └── mockData.ts            # Dados mockados para testes
├── types/
│   └── orderLoss.types.ts     # Interfaces e tipos TypeScript
├── views/
│   └── OrderLossView.tsx      # Página principal
└── index.ts                    # Exports centralizados
```

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Tailwind CSS v3**
- **Radix UI** (Dialog, ScrollArea, Separator)
- **Lucide React** (Ícones)
- **shadcn/ui** (Componentes)

## 🚀 Como Usar

### Importar a View

```tsx
import { OrderLossView } from '@/features/orderLoss';

// Em sua rota
<Route path="/order-loss" element={<OrderLossView />} />
```

### Usar Componentes Individualmente

```tsx
import { KPICards, KanbanBoard } from '@/features/orderLoss';

// Use os componentes conforme necessário
<KPICards data={kpiData} />
<KanbanBoard sellers={sellersData} />
```

## 📊 Dados Mockados

Atualmente a feature utiliza dados mockados definidos em `services/mockData.ts`. Inclui:
- 9 pedidos distribuídos entre 5 vendedores
- Mix de pedidos em negociação e perdidos
- Produtos variados com diferentes margens e pesos
- Justificativas realistas para perdas

## 🔄 Próximos Passos (Integração com Backend)

1. Criar serviço de API real em `services/orderLoss.service.ts`
2. Definir endpoints no backend
3. Substituir `mockData` por chamadas de API
4. Adicionar estados de loading e erro
5. Implementar atualização em tempo real (opcional)

## 💡 Sugestões de Melhorias Futuras

- [ ] Filtros por status, vendedor, período
- [ ] Busca por cliente ou número de pedido
- [ ] Exportação de relatórios
- [ ] Gráficos de evolução temporal
- [ ] Notificações de novos pedidos
- [ ] Drag & drop entre status
- [ ] Ordenação customizável
- [ ] Paginação para grandes volumes

## 🎨 Design System

A feature segue o design system do projeto:
- Usa componentes da pasta `@/components/ui`
- Aplica classes Tailwind consistentes
- Segue o padrão de cores do tema
- Responsivo (mobile-first)

## 📝 Notas de Desenvolvimento

- Cards são clicáveis e abrem modal de detalhes
- Scroll horizontal no Kanban para muitos vendedores
- Scroll vertical em cada coluna para muitos pedidos
- Formatação de moeda e peso em pt-BR
- Badges coloridos indicam status visual
