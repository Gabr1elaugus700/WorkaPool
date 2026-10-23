---
version: 1
slug: "nd-src-features-ibc-views-ibcprodutoconfigview-tsx"
primary_target: "frontend/src/features/ibc/views/IbcProdutoConfigView.tsx"
related_targets: ["frontend/src/features/ibc/components/IbcProdutoConfigLista.tsx","frontend/src/features/ibc/components/IbcProdutoConfigModal.tsx","frontend/src/features/ibc/components/GestaoIbcHeader.tsx"]
---

# Surface Brief: Configuração de produto — placa

## Job and audience

- **Modo:** Operate
- **Quem chega:** ALMOX e ADMIN configuram; LOGISTICA e GERENTE_DPTO só leem.
- **Tarefa:** dar sigla e cor de placa a cada grupo do Sapiens, e cor ao universal.
- **Prova:** descrição, sigla, amostra, "em uso" e o aviso "não encontrado no Sapiens".
- **Restrição:** Sapiens é o catálogo. Não editar o modal de cadastro de container. Cor repetida vem da API.

## Direction contract

THESIS: A placa é uma linha de catálogo — grupo, sigla, amostra. Recusa o cadastro livre de nome e recusa pintar a página com a cor do produto.

OWN-WORLD: Operations Greenroom — canvas névoa, card branco, Inter, shadow-sm, raio médio. Verde só em Salvar placa. A cor do produto vive na amostra.

STORY: O almox vê o que falta, abre a placa, grava sigla e cor, e lê na hora quando a API recusa repetição ou uso.

FIRST VIEWPORT: Cabeçalho Gestão de IBC, aba Produtos, tabela com Universal no topo e Editar só para quem escreve.

FORM: Lista da Gestão IBC. Extensão pedida na #420; concept-seed não se aplica.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
