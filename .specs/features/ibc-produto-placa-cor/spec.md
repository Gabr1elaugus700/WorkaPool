# IBC — produto do Sapiens, placa colorida e container universal

## Problem Statement

O cadastro de produto do módulo de IBC é uma tabela local, digitada pelo usuário, sem relação com o Sapiens. O pedido traz o `codPro`, mas nada liga esse código ao produto do container. Por isso o sistema não sabe se o container que sobe na carga é do produto que o pedido leva.

No mundo real, cada container recebe uma placa de identificação. A placa tem o número do container e uma cor, e a cor diz o produto: soda é vermelho. Um container homologado (HM) serve a um único produto durante toda a vida. Quando deixa de ser homologado, vira não homologado (NH). Nesse caso o prefixo muda e a placa é trocada. O NH pode continuar com um produto ou virar universal, um container lavado entre usos que atende qualquer produto.

Hoje o sistema não tem cor e não tem container universal. O prefixo do não homologado é `NHM`, que não bate com a placa física (`NH`). Um HM pode mudar de produto, o que contradiz o processo. E a expedição aceita container de cloro numa carga de soda.

## Solution

Os produtos passam a vir do Sapiens. A sincronização noturna que já existe (`produto_grupo_map`, alimentada por `poolbi.dbo.grppro`) é o catálogo: cada `codPro` aponta para um grupo. O produto do container é o **grupo**. O usuário não cadastra nem renomeia grupo.

O almoxarifado configura, por grupo, a **sigla** e a **cor da placa**, num modal com seletor de cor. Existe também uma configuração **Universal**, só com cor. Depois que algum container usa a configuração, sigla e cor ficam congeladas.

No cadastro do container, o operador escolhe o grupo e o sistema monta o identificador com a sigla. A placa é o identificador mais a cor do grupo. Não existe tabela de placas.

- Homologado: `HM` + sigla. Produto obrigatório e fixo para sempre.
- Não homologado com produto: `NH` + sigla.
- Não homologado universal: `NH`, sem sigla.

Conversão e troca de produto continuam criando um container novo, com o próximo sequencial do prefixo novo e placa nova. O histórico guarda a placa de antes e a de depois.

Na saída e na volta, o container precisa ser compatível com o produto. Na saída, ao vincular na carga, o grupo do container tem de estar entre os grupos dos pedidos elegíveis da carga, ou o container tem de ser universal. Na volta, ao apontar o container a um pedido, vale a mesma regra contra os grupos daquele pedido. Incompatível é recusado.

## User Stories

1. As an operador ALMOX, I want a lista de grupos de produto vir do Sapiens, so that eu não digite nem invente produto.
2. As an operador ALMOX, I want to definir a sigla de um grupo, so that o identificador do container saia com a letra certa.
3. As an operador ALMOX, I want to escolher a cor da placa de um grupo num seletor de cor, so that o sistema mostre a mesma cor da placa física.
4. As an operador ALMOX, I want to definir a cor da placa do container universal, so that o universal também tenha placa identificável.
5. As an operador ALMOX, I want sigla e cor travadas depois que algum container usa o grupo, so that a placa física e o sistema não divirjam.
6. As an operador ALMOX, I want a grupo que sumiu do Sapiens to manter a configuração e os containers, so that nada se perca por mudança no ERP.
7. As an operador ALMOX, I want a grupo que sumiu do Sapiens to sair do cadastro de container novo e aparecer com aviso na configuração, so that eu saiba que ele não existe mais no ERP.
8. As an operador ALMOX, I want to escolher o grupo no modal de cadastro de container, so that a sigla e a cor venham da configuração.
9. As an operador ALMOX, I want only grupos com sigla e cor configuradas no modal de cadastro, so that nenhum container nasça sem placa definida.
10. As an operador ALMOX, I want a container homologado to exigir grupo, so that HM sempre tenha um produto.
11. As an operador ALMOX, I want to cadastrar um não homologado com ou sem grupo, so that eu registre tanto o NH de um produto quanto o universal.
12. As an operador ALMOX, I want the identificador to seguir `HM`+sigla, `NH`+sigla ou `NH`, com sequencial próprio por prefixo, so that a placa física e o sistema usem o mesmo código.
13. As an operador ALMOX, I want to não conseguir trocar o produto de um HM, so that o HM continue fixo no produto dele.
14. As an operador ALMOX, I want to converter um HM em NH escolhendo manter o produto ou virar universal, so that a conversão reflita o uso que o container vai ter.
15. As an operador ALMOX, I want a conversão to gerar o próximo número do prefixo novo, so that eu saiba que preciso de placa nova.
16. As an operador ALMOX, I want to trocar o produto de um NH, inclusive de universal para produto e de produto para universal, so that o NH acompanhe o uso real.
17. As an operador ALMOX, I want to nunca transformar um NH de volta em HM, so that a homologação perdida não volte por engano.
18. As an operador ALMOX, I want the histórico to guardar identificador e cor de antes e de depois, so that eu saiba qual placa o container usava em cada época.
19. As an operador ALMOX, I want to ver a cor do produto na lista e no detalhe do container, so that eu reconheça o container como reconheço a placa.
20. As an operador ALMOX, I want a carga de soda to recusar container de cloro na saída, so that o caminhão não saia com container do produto errado.
21. As an operador ALMOX, I want a carga de soda to aceitar HM de soda, NH de soda ou NH universal, so that eu tenha as três opções válidas do processo.
22. As an operador ALMOX, I want a carga com vários produtos to aceitar container de qualquer produto dela, so that a regra siga a carga inteira na saída.
23. As an operador ALMOX, I want a volta to recusar um container de cloro apontado como ficou num pedido de soda, so that o papel do motorista não seja transcrito para o produto errado.
24. As an operador ALMOX, I want um pedido de grupo sem configuração to ser atendido só por container universal, com aviso, so that a expedição não pare e eu saiba o motivo.
25. As an operador ALMOX, I want os containers legados sem produto to continuar como estão, com placa neutra, so that o histórico não seja reescrito.
26. As an operador ALMOX, I want to converter um legado sem produto em NH com produto ou universal, so that ele entre no padrão novo.
27. As an operador ALMOX, I want a legado sem produto to ser recusado na saída e na volta até ser convertido, so that todo container que circula tenha produto ou seja universal.
28. As an operador ALMOX, I want to não conseguir usar a mesma cor em dois grupos, so that cada cor de placa diga um único produto.

## Implementation Decisions

### Catálogo e configuração

- O catálogo de grupos é `SELECT DISTINCT grupo_codigo, grupo_descricao FROM produto_grupo_map`. Não se cria sincronização nova. A sincronização existente troca a tabela de forma atômica (staging + rename), então nada aponta para ela com chave estrangeira.
- `IbcProduto` deixa de ser cadastro livre e vira a **configuração por grupo**. Ela está vazia, então não há migração de dado. Campos: `grupoCodigo` (único, sem FK), `sigla` (1–2 letras A–Z, única), `corHex` (`#RRGGBB`) e `universal` (booleano; um único registro com `universal = true`, sem `grupoCodigo` e sem `sigla`). `nome` sai: a descrição vem do catálogo.
- Grupo configurado = tem `sigla` e `corHex`. O universal está configurado quando tem `corHex`.
- A cor é única entre as configurações, contando a do universal: 409 `IBC_PRODUTO_COR_EM_USO`. A comparação ignora maiúsculas e minúsculas no hex.
- Sigla e cor ficam congeladas quando algum `Ibc` usa a configuração, inclusive baixados e substituídos: 409 `IBC_PRODUTO_CONFIG_EM_USO`. Enviar o mesmo valor depois de normalizar não é mudança. Antes do primeiro container, as duas são editáveis.
- Leitura da configuração: ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO. Escrita: ADMIN e ALMOX, com o papel conferido no use case.
- Grupo da configuração que não aparece mais no catálogo: a configuração e os containers ficam como estão. A lista de configuração devolve `encontradoNoSapiens: false` e o grupo sai das opções do cadastro de container novo.

### Identificador e cadastro

- Prefixos: `HM` + sigla, `NH` + sigla, `NH` (universal). Sequencial de 5 dígitos, independente por prefixo exato, alocado sob o lock por prefixo que já existe. `NHM` deixa de ser gerado. Identificadores `NHM…` e `HM####` já gravados não são recalculados.
- Cadastro unitário e em lote recebem `homologado` e, opcionalmente, o grupo. HM sem grupo: 422 `IBC_PRODUTO_OBRIGATORIO`. Grupo sem configuração, ou fora do catálogo: 422 `IBC_PRODUTO_NAO_CONFIGURADO`.
- O `Ibc` guarda a referência à configuração (`produtoId`). A cor exibida vem da configuração. O universal referencia o registro `universal`.

### Ciclo de vida

- **Mudança de produto em HM** deixa de existir: 409 `IBC_HOMOLOGADO_PRODUTO_FIXO`.
- **Conversão HM → NH** recebe o destino: manter o grupo (`HMS` → `NHS`) ou universal (`NH`). Cria um container novo com o próximo sequencial do prefixo de destino e mantém a linhagem (`convertedToContainerId`, `IbcConversionHistory` `conversion`).
- **Troca de produto em NH** permite universal → grupo, grupo → grupo e grupo → universal, com a mesma mecânica (`product_change`). Nunca resulta em HM.
- O **legado sem produto** (`HM####`) pode ser convertido para NH com grupo ou universal pelo mesmo fluxo da conversão.
- `IbcConversionHistory` passa a guardar a foto da placa: `identificadorAnterior`, `corAnterior`, `identificadorNovo` e `corNova`. Os eventos antigos ficam com esses campos nulos.

### Compatibilidade na saída e na volta

- Regra única, `isIbcCompativelComGrupos(ibc, grupos)`: é compatível se o container é universal, ou se o grupo dele está em `grupos`. Legado sem produto (`HM####`) nunca é compatível: 409 `IBC_PRODUTO_INCOMPATIVEL` até ser convertido para NH.
- A **foto de pedidos IBC** (`CargaPedidoIbc`) passa a gravar `gruposCodigo` (lista de códigos de grupo, `NOT NULL`) do pedido, na mesma transação do Fechar Carga. `QUERY_GET_PEDIDOS_BY_CARGA` passa a trazer `grp.codgrp`. Só as linhas com embalagem 251001 entram na lista: `251001` é a embalagem da própria linha do produto (o produto envasado em IBC), não um item separado. Linhas em outra embalagem não precisam de container.
- **Fotos gravadas antes desta mudança** são resolvidas na migração, não no código. A coluna nasce com default `{}`. Um script de backfill, rodado uma vez no deploy, preenche os grupos só das fotos de cargas cuja viagem ainda não fechou (sem `ExpedicaoIbc` ou com `viagemFechadaEm` nulo). Ele lê do Sapiens os itens por `numPed`, sem filtrar `sitped`, porque o pedido já pode ter sido faturado, e resolve o grupo por `produto_grupo_map`. Viagem fechada não passa mais por alocação nem por conciliação, então o `{}` dela nunca é lido pela regra. Os use cases não têm ramo de "foto antiga".
- **Saída** (criar alocação): os grupos permitidos são a união de `gruposCodigo` dos pedidos elegíveis da foto. Incompatível: 409 `IBC_PRODUTO_INCOMPATIVEL` com `{ identificador, grupoContainer, gruposPermitidos }`.
- **Volta** (PUT da conciliação, destino ficou ou troca): os grupos permitidos são os `gruposCodigo` do pedido apontado. Incompatível: 409 `IBC_PRODUTO_INCOMPATIVEL`. O Fechar Viagem repete a checagem antes de gravar. Destino retornou não tem pedido, então não checa.
- Pedido com grupo sem configuração: só o universal atende esse grupo. A saída devolve um aviso por pedido (`IBC_PEDIDO_GRUPO_SEM_CONFIG`), sem bloquear o resto da carga.
- O fechar expedição continua conferindo só o total exato da carga. Não há contagem por grupo.

### UI

- Nova tela de configuração de produto (ALMOX/ADMIN): uma lista de grupos do catálogo com sigla, amostra de cor, "em uso" e o aviso "não encontrado no Sapiens". Editar abre um modal com seletor de cor. A linha Universal fica fixa no topo.
- O modal de cadastro de container troca "produto" por um seletor de grupo (só os configurados) e um controle homologado/não homologado. Em NH, o grupo é opcional e a opção vazia é "Universal (lavado entre usos)".
- Lista e detalhe do container mostram a cor da placa ao lado do identificador. Legado sem produto mostra a placa neutra.
- O modal de conversão pergunta "manter produto" ou "universal". O modal de troca de produto só aparece para NH.

## Testing Decisions

- O seam é o use case: entrada, erro tipado e efeito persistido ou DTO. Não se afirma ordem de chamada nem detalhe de query.
- Módulos cobertos: configuração de produto (listar, editar, congelar), cadastro unitário e em lote, conversão, troca de produto, montagem da foto de pedidos, criar alocação, PUT da conciliação e fechar viagem.
- Prior art: as suítes unitárias que já existem para `CreateNovoIbc`, `CreateLoteIbc`, `ConvertIbcHomologacao`, `ChangeIbcProduto`, `buildCargaPedidoIbcSnapshot`, alocação e conciliação.
- Casos que o seam tem de mostrar:
  - Na configuração: sigla e cor travadas com container; cor repetida recusada; grupo fora do catálogo marcado e fora do cadastro.
  - No cadastro e no ciclo de vida: HM sem grupo recusado; NH universal com prefixo `NH`; sequencial independente entre `NHS` e `NH`; troca de produto em HM recusada; conversão para universal; NH nunca vira HM; snapshot de placa no histórico.
  - Na compatibilidade: cloro recusado em carga de soda; HM, NH e universal aceitos; carga com dois grupos aceita os dois; ficou de cloro em pedido de soda recusado na volta; pedido sem grupo configurado só com universal e com aviso; legado sem produto recusado; o backfill preenche só as fotos de viagens abertas.
- Integração HTTP só onde a suíte de expedição ou conciliação já atravessa persistência.

## Out of Scope

- Contagem exata por grupo no fechar expedição.
- Escrita no Sapiens, ou edição do catálogo de grupos no WorkaPool.
- Uma sincronização nova. A existente já roda todo dia às 03:00.
- Impressão de placa ou de etiqueta.
- Cor fora da lista e do detalhe do container (alocação, conciliação, relatório de viagem e entrada de pátio ficam como estão).
- Tabela ou estoque de placas físicas com numeração própria.
- Reescrever identificador de container já cadastrado (`HM####`, `NHM…`).

## Further Notes

- O vocabulário do `backend/src/features/ibc/CONTEXT.md` foi atualizado junto com esta spec: Produto para Container, Identificador, Conversão, Mudança de produto, Container universal, Placa, Compatibilidade de produto e Foto de pedidos IBC.
- Vocabulário: Grupo de produto, Configuração de produto, Sigla, Cor da placa, Placa, Container universal, Homologado (HM), Não homologado (NH), Conversão, Mudança de produto, Compatibilidade de produto, Foto de pedidos IBC.
