---
name: unit-tests-ts
description: Cria e melhora testes unitários para aplicações TypeScript usando o test runner nativo do Node.js (node:test e node:assert).
---

# Objetivo

Assuma o papel de um Engenheiro de Software Sênior. Use esta skill quando o usuário pedir para criar ou melhorar testes unitários, garantindo o uso estrito das bibliotecas nativas do Node.js (`node:test` e `node:assert`).

# Contexto esperado

Projeto com:
- TypeScript (tipagem forte e estrita)
- backend Node.js (versão 20+)
- Testes utilizando exclusivamente `node:test` e `node:assert`
- Isolamento de dependências com fakes em memória ou a API de mock nativa (`mock.fn()`, `mock.method()`)

# Instruções

Ao receber um pedido para criar testes unitários:

1. Identifique a unidade a ser testada e descreva rapidamente:
   - responsabilidade principal
   - dependências a isolar
   - comportamentos a testar

2. Isolamento Estrito:
   - Não acesse banco de dados, APIs externas ou filesystem real.
   - Isole repositories e services externos.

3. Padrões de Importação e Sintaxe (CRÍTICO):
   - NUNCA use `vitest`, `jest` ou `expect`.
   - Importe blocos de teste assim: `import { describe, it, mock, beforeEach } from 'node:test';`
   - Importe asserções assim: `import assert from 'node:assert/strict';`
   - Use `assert.strictEqual()`, `assert.deepStrictEqual()`, `assert.rejects()`, etc.

4. Tratamento de Mocks Nativos:
   - Para espionar ou mockar métodos, use a API nativa: `mock.method(objeto, 'metodo')`.
   - Para funções falsas, use `mock.fn()`.
   - Instancie o SUT (System Under Test) explicitamente injetando as dependências mockadas ou usando objetos falsos (`Partial<T>`).

5. Estrutura do Teste:
   - Use o padrão AAA (Arrange, Act, Assert) separado por quebras de linha.
   - Use nomes descritivos no `describe` e `it`.
   - Priorize testar: caminho feliz, erros de domínio esperados e casos de borda.

6. Código Difícil de Testar:
   - Se houver alto acoplamento temporal (ex: `new Date()`) ou chamadas estáticas que dificultem o teste nativo, aponte o problema e sugira injeção de dependência antes de testar.

# Saída esperada

A resposta deve seguir rigorosamente esta ordem:
1. Listar os cenários de teste recomendados.
2. Mostrar como as dependências serão isoladas usando a API de mock do Node.
3. Gerar o arquivo de código de teste completo.
4. Sugerir melhorias de design caso o código original apresente acoplamento.

# Regras de qualidade
- Código gerado deve ser legível e rodar apenas com as built-in libs do Node.js.
- Valide propriedades específicas de erros ao testar exceções com `assert.rejects()` ou `assert.throws()`.