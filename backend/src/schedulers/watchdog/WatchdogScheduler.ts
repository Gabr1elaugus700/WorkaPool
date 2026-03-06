import * as cron from "node-cron";
import { watchdogConfig } from "./watchdogConfig";

/**
 * WatchdogScheduler
 * 
 * Serviço de agendamento que executa tarefas periodicamente em background.
 * Por padrão, executa a cada 2 minutos conforme configurado em watchdogConfig.ts
 * 
 * @example
 * ```typescript
 * const watchdog = new WatchdogScheduler();
 * watchdog.start(); // Inicia o agendamento
 * watchdog.stop();  // Para o agendamento
 * ```
 */
export class WatchdogScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  /**
   * Inicia o agendamento das tarefas
   * O watchdog começará a executar no intervalo configurado
   */
  public start(): void {
    if (!watchdogConfig.enabled) {
      console.log("⚠️  Watchdog desabilitado nas configurações");
      return;
    }

    if (this.isRunning) {
      console.log("⚠️  Watchdog já está em execução");
      return;
    }

    try {
      this.task = cron.schedule(
        watchdogConfig.cronExpression,
        async () => {
          await this.executeTask();
        },
        {
          timezone: watchdogConfig.timezone,
        }
      );

      this.isRunning = true;
      console.log(
        `🔧 Watchdog iniciado - executando a cada 2 minutos (${watchdogConfig.cronExpression})`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ Erro ao iniciar watchdog: ${errorMessage}`);
    }
  }

  /**
   * Para o agendamento das tarefas
   * Útil para manutenção ou desligamento controlado
   */
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.isRunning = false;
      console.log("🛑 Watchdog parado");
    }
  }

  /**
   * Verifica se o watchdog está em execução
   */
  public getStatus(): boolean {
    return this.isRunning;
  }

  /**
   * ============================================
   * MÉTODO PRIVADO - ADICIONE SUA LÓGICA AQUI
   * ============================================
   * 
   * Este método é executado automaticamente a cada 2 minutos.
   * 
   * EXEMPLOS DE USO:
   * 
   * 1. Processar pedidos pendentes:
   * ```typescript
   * const pedidosPendentes = await prisma.pedido.findMany({
   *   where: { status: 'PENDENTE' }
   * });
   * // ... processar pedidos
   * ```
   * 
   * 2. Sincronizar dados externos:
   * ```typescript
   * const response = await fetch('https://api.externa.com/dados');
   * const dados = await response.json();
   * // ... salvar no banco
   * ```
   * 
   * 3. Limpar registros antigos:
   * ```typescript
   * await prisma.log.deleteMany({
   *   where: {
   *     createdAt: {
   *       lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias
   *     }
   *   }
   * });
   * ```
   * 
   * 4. Verificar status de serviços:
   * ```typescript
   * const servicos = ['API1', 'API2', 'DB'];
   * for (const servico of servicos) {
   *   const status = await verificarSaude(servico);
   *   if (!status.ok) {
   *     console.error(`❌ ${servico} está fora do ar`);
   *   }
   * }
   * ```
   */
  private async executeTask(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("🔄 Executando tarefa do watchdog...");

      // ============================================
      // 👇 ADICIONE SUA LÓGICA PERSONALIZADA AQUI
      // ============================================

      // Exemplo: Simples log de execução
      console.log(`✅ Tarefa executada com sucesso em ${Date.now() - startTime}ms`);

      // DICA: Remova o exemplo acima e adicione seu código
      // Por exemplo:
      // - Chamar um use case: await new ProcessarPedidosUseCase().execute()
      // - Acessar banco de dados: await prisma.pedido.findMany(...)
      // - Fazer requisição HTTP: await fetch(...)
      // - Processar arquivos: fs.readdir(...)
      
      // ============================================
      // 👆 FIM DA ÁREA DE PERSONALIZAÇÃO
      // ============================================

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ Erro ao executar tarefa do watchdog: ${errorMessage}`);
      
      // OPCIONAL: Adicione aqui lógica de notificação/alerta
      // Por exemplo: enviar email, criar log no banco, chamar webhook, etc.
    }
  }
}
