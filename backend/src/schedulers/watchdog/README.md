# Watchdog Scheduler

Serviço de agendamento que executa tarefas periodicamente em background.

## Como funciona

O watchdog é iniciado automaticamente quando o servidor sobe (veja `server.ts`). Por padrão, ele executa a cada **2 minutos**.

## Configuração

Edite o arquivo `watchdogConfig.ts` para alterar:

- **cronExpression**: Intervalo de execução usando sintaxe cron
- **enabled**: Habilita/desabilita o watchdog
- **timezone**: Timezone para executar as tarefas

### Exemplos de intervalos (cron)

```
"*/2 * * * *"  = A cada 2 minutos
"*/5 * * * *"  = A cada 5 minutos
"*/15 * * * *" = A cada 15 minutos
"0 * * * *"    = A cada hora (no minuto 0)
"0 0 * * *"    = Todo dia à meia-noite
"0 9 * * 1"    = Toda segunda-feira às 9h
```

Formato: `minuto hora dia-do-mês mês dia-da-semana`

Documentação completa: https://github.com/node-cron/node-cron

## Adicionar sua lógica

Abra o arquivo `WatchdogScheduler.ts` e localize o método `executeTask()`.

Adicione seu código na área marcada:

```typescript
private async executeTask(): Promise<void> {
  try {
    console.log("🔄 Executando tarefa do watchdog...");

    // ============================================
    // 👇 ADICIONE SUA LÓGICA PERSONALIZADA AQUI
    // ============================================

    // EXEMPLO 1: Processar pedidos pendentes
    const pedidosPendentes = await prisma.pedido.findMany({
      where: { status: 'PENDENTE' }
    });
    // ... processar pedidos

    // EXEMPLO 2: Sincronizar dados externos
    const response = await fetch('https://api.externa.com/dados');
    const dados = await response.json();
    // ... salvar no banco

    // EXEMPLO 3: Limpar logs antigos
    await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias
        }
      }
    });

    console.log(`✅ Tarefa executada com sucesso`);

  } catch (error) {
    console.error(`❌ Erro ao executar tarefa do watchdog:`, error);
  }
}
```

## Controle manual

Se precisar controlar o watchdog manualmente:

```typescript
const watchdog = new WatchdogScheduler();

// Iniciar
watchdog.start();

// Verificar status
watchdog.getStatus(); // true ou false

// Parar
watchdog.stop();
```

## Logs

O watchdog gera logs automáticos:

- `🔧` Quando é iniciado
- `🔄` A cada execução
- `✅` Quando completa com sucesso
- `❌` Quando ocorre erro
- `🛑` Quando é parado

## Desabilitar temporariamente

Para desabilitar sem remover o código, edite `watchdogConfig.ts`:

```typescript
export const watchdogConfig = {
  cronExpression: "*/2 * * * *",
  enabled: false, // ← Altere para false
  timezone: "America/Sao_Paulo",
};
```
