---
version: 1
slug: "eatures-ibc-components-cargaibcpreparacaoetapa-tsx"
primary_target: "frontend/src/features/ibc/components/CargaIbcPreparacaoEtapa.tsx"
related_targets: ["frontend/src/features/ibc/components/CargaIbcContainersPaleta.tsx","frontend/src/features/ibc/components/IbcContainerChip.tsx","frontend/src/features/ibc/components/BuscarContainersDialog.tsx"]
---

# Surface Brief: Preparação da carga IBC — paleta de containers

## Job and audience

- **Modo:** Operate
- **Quem chega:** operador ALMOX (e ADMIN) no pátio, montando a carga fechada antes de sair.
- **Tarefa:** vincular à carga exatamente a quantidade esperada de containers compatíveis, e corrigir vínculos antes de fechar a expedição.
- **Prova:** código do container, cor da placa do produto, grupo, contagem vinculados / esperado.
- **Restrição:** só containers aptos, livres e compatíveis (mesmas regras do POST de alocação). Expedição fechada vira só consulta.

## Direction contract

THESIS: Paleta, não formulário. O operador vê os containers que servem e acende os que sobem; digitar código é exceção, no modal.

OWN-WORLD: Operations Greenroom. Inter, canvas neutro, card branco, borda quieta. A cor da placa do produto é o sinal do container: amostra pequena no chip, viva quando vinculado, desbotada quando disponível. Verde continua só para ação e progresso.

STORY: Faixa "Na carga" com os vinculados vivos (clique desvincula). Disponíveis opacos agrupados por grupo de produto, depois Universal, depois Não homologados (clique vincula). Cerca de duas linhas; "Buscar mais containers" abre o modal com busca e vínculo por código livre.

FIRST VIEWPORT: Cabeçalho da carga, etapas, alertas, e o cartão "Containers da carga" com contagem, barra de progresso, faixa Na carga e disponíveis.

FORM: Chip estilo placa (amostra de cor + código mono). Estado não depende só de cor: check / x e opacidade. Referência: `.impeccable/mocks/ibc-paleta-containers/`.
