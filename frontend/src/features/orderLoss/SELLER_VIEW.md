# Seller Orders View - Visão do Vendedor

## 📋 Descrição

Tela exclusiva para vendedores visualizarem e gerenciarem seus próprios pedidos, incluindo funcionalidade para informar motivos de perda de pedidos.

## 🎯 Funcionalidades

### Cards de Estatísticas
- **Total de Pedidos**: Quantidade total e valor agregado
- **Em Negociação**: Pedidos ativos e valor em negociação
- **Pedidos Perdidos**: Total de perdas com badge de pendências

### Lista de Pedidos
- **Ordenação**: Por data de emissão (mais recente primeiro)
- **Informações Rápidas**: Cliente, valor, peso, margem, data
- **Status Visual**: 
  - Badge amarelo para negociações
  - Badge vermelho para pedidos perdidos
- **Detalhes Completos**: Clique para ver modal com todos os produtos

### Gestão de Motivos de Perda

#### Códigos de Motivo Disponíveis:
- **Frete**: Problemas relacionados a custo ou prazo de entrega
- **Preço**: Valor do produto acima do orçamento do cliente
- **Margem**: Margem solicitada não aprovada internamente
- **Estoque**: Indisponibilidade de produtos
- **Outro**: Outros motivos não categorizados

#### Processo:
1. Pedidos perdidos sem justificativa são destacados
2. Botão "Informar Motivo" expande formulário inline
3. Vendedor seleciona código e escreve justificativa (mínimo 10 caracteres)
4. Sistema registra data/hora da submissão
5. Justificativa fica visível no card do pedido

### Alertas e Notificações
- Alerta no topo quando há pedidos sem justificativa
- Badge "X pendentes" nos pedidos perdidos
- Destaque visual nos cards que necessitam ação

## 📁 Arquivos Criados

### Componentes
```
components/
├── LossReasonForm.tsx          # Formulário de motivo de perda
└── SellerOrdersList.tsx        # Lista de pedidos do vendedor
```

### Views
```
views/
└── SellerOrdersView.tsx        # Página principal do vendedor
```

### Services
```
services/
└── sellerMockData.ts           # Dados mockados específicos do vendedor
```

### Types (Estendidos)
```
types/
└── orderLoss.types.ts          # Adicionados LossReasonCode e LossReasonDetail
```

## 🛠️ Tecnologias

- React 19 com TypeScript
- Tailwind CSS v3
- Radix UI (Dialog, Select, Separator)
- shadcn/ui (Card, Badge, Button, Label)
- Lucide React (Ícones)
- Reutilização de componentes existentes (OrderDetailsModal)

## 🚀 Como Usar

### Importar a View

```tsx
import { SellerOrdersView } from '@/features/orderLoss';

// Em sua rota
<Route path="/my-orders" element={<SellerOrdersView />} />
```

### Estrutura de Dados

```typescript
// Motivo de perda estruturado
interface LossReasonDetail {
  code: LossReasonCode; // 'freight' | 'price' | 'margin' | 'stock' | 'other'
  description: string;
  submittedAt: Date;
}

// Pedido com motivo de perda
interface Order {
  // ... outros campos
  lossReasonDetail?: LossReasonDetail;
}
```

## 📊 Dados Mockados

### Vendedor Simulado
- **Nome**: João Silva
- **ID**: SELL-001
- **Email**: joao.silva@workapool.com

### Pedidos Mockados
- **10 pedidos** no total
- **4 em negociação**
- **6 perdidos** (3 com justificativa, 3 sem justificativa)
- Distribuídos entre 2 de janeiro e 20 de janeiro de 2026
- Mix de valores, pesos e margens realistas

## 🔄 Fluxo de Uso

1. Vendedor acessa a tela
2. Visualiza estatísticas gerais no topo
3. Recebe alerta se houver pendências
4. Navega pela lista ordenada por data
5. Clica em "Ver Detalhes" para consultar produtos
6. Para pedidos perdidos sem justificativa:
   - Clica em "Informar Motivo"
   - Seleciona o código apropriado
   - Escreve justificativa detalhada
   - Confirma a submissão
7. Justificativa aparece imediatamente no card
8. Badge de pendências é atualizado

## 💡 Diferenças entre as Views

### OrderLossView (Gestor)
- Visão Kanban por vendedor
- Todos os vendedores e pedidos
- KPIs agregados (peso, margem, negociações)
- Foco em análise gerencial
- Somente leitura

### SellerOrdersView (Vendedor)
- Lista linear ordenada por data
- Apenas pedidos do vendedor logado
- Estatísticas pessoais
- Foco em ação (informar motivos)
- Funcionalidade de escrita (justificativas)

## 🎨 Design Highlights

- **Cards Expansíveis**: Formulário inline ao clicar em "Informar Motivo"
- **Feedback Visual**: Cores e ícones indicam status e urgência
- **Validação de Formulário**: Mínimo de caracteres e campos obrigatórios
- **Responsivo**: Layout adapta para mobile e desktop
- **Acessibilidade**: Labels, aria-labels e navegação por teclado

## 📝 Validações Implementadas

- Código do motivo é obrigatório
- Justificativa é obrigatória
- Justificativa deve ter mínimo 10 caracteres
- Máximo 500 caracteres na justificativa
- Feedback de erro claro e contextual

## 🔮 Próximos Passos (Backend)

1. Criar endpoint para listar pedidos do vendedor
2. Criar endpoint para submeter motivo de perda
3. Implementar autenticação e controle de acesso
4. Adicionar webhook/notificação para gestores
5. Histórico de alterações de justificativas
6. Relatórios de motivos de perda por período

## 🧪 Teste da Feature

Para testar a funcionalidade completa:
1. Acesse a view do vendedor
2. Observe os 3 pedidos perdidos sem justificativa
3. Clique em "Informar Motivo" em um deles
4. Selecione um código e escreva uma justificativa
5. Clique em "Confirmar Perda"
6. Observe a atualização imediata dos badges e estatísticas
7. Clique em "Ver Detalhes" para ver o modal
