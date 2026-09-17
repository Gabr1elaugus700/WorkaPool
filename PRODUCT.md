# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Gestores comerciais e vendedores que precisam operar carteira, pedidos e relacionamento comercial no dia a dia.
- Times internos de operacao, administrativo e lideranca como publico secundario para execucao e suporte entre modulos.

## Product Purpose

WorkaPool unifica operacao comercial e operacional em um unico produto interno para reduzir consultas manuais em sistemas separados e acelerar a tomada de decisao no dia a dia.

Sucesso do produto significa que usuarios conseguem localizar informacoes criticas, executar fluxos recorrentes e agir sem depender de consultas ad hoc fora da plataforma.

## Positioning

Hub interno unico que integra dados de ERP com fluxos operacionais e comerciais em uma interface de trabalho orientada a decisao rapida.

## Operating Context

- Uso recorrente por equipes internas em rotinas comerciais e operacionais.
- Dependencia de dados corporativos vindos de ERP (Senior/Sapiens) e read models no Postgres para consultas de produto.
- Fluxos cobrem carteira de clientes, pedidos/perdas, cargas/fretes, metas e ordem de servico/vistoria.
- Controle de acesso por papeis para recorte de carteira e permissoes administrativas.

## Capabilities and Constraints

- Aplicacao web SPA em React + TypeScript com backend Express + TypeScript e persistencia em Postgres via Prisma.
- Integracoes com SQL Server (Sapiens) alimentam consultas e pipelines de sincronizacao.
- O ERP permanece como fonte de verdade para fatos transacionais; o produto consome e materializa dados para uso operacional.
- Rastreamento por modulos/feature folders e evolucao incremental de arquitetura.
- Restricoes de acesso por role/codRep sao obrigatorias para funcionalidades sensiveis de carteira e pedidos.

## Brand Commitments

- Nome do produto: WorkaPool.
- Manter consistencia terminologica com o dominio atual (ex.: carteira, pedidos, perdas, cargas, fretes, overview de cliente).

## Evidence on Hand

- PRD detalhado do Customer Overview em `docs/prd/overview-customer/PRD.md`.
- Documentacao de arquitetura e mapa do codigo em `docs/CODEBASE_MAP.md`, `docs/FRONTEND.md` e `docs/BACKEND.md`.
- Contratos e inventario de rotas em `backend/docs/API_ROUTES.md`.
- Suites de teste documentadas para overview customer em `docs/test-suites/`.
- Nao ha, neste repositorio, evidencias de claims externos de mercado (depoimentos publicos, benchmarks publicados ou materiais de marketing externos).

## Product Principles

- Centralizar decisao operacional em um unico lugar sem fragmentar contexto entre ferramentas.
- Preservar fidelidade dos dados ao sistema de origem e tornar a leitura rapida para acao.
- Garantir controles de acesso coerentes com responsabilidades de negocio.
- Entregar evolucao por fatias verticais testaveis sem interromper fluxos existentes.

## Accessibility & Inclusion

- Sem requisito formal de conformidade registrado ate o momento (ex.: WCAG 2.1 AA).
- Decisao em aberto: formalizar um padrao de acessibilidade como criterio obrigatorio de entrega.
