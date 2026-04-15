import * as cron from "node-cron";
import { watchdogConfig } from "./watchdogConfig";
import { CheckPesoPedidoHistoricoUseCase } from "../../features/cargo/useCases/CheckPesoPedidoHistorico.use-case";

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
  private checkPesoPedidoUseCase: CheckPesoPedidoHistoricoUseCase;

  constructor() {
    this.checkPesoPedidoUseCase = new CheckPesoPedidoHistoricoUseCase();
  }

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
   * Executa a verificação de peso dos pedidos em cargas abertas
   * Este método é chamado automaticamente a cada 2 minutos
   */
  private async executeTask(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("\n🔄 ===== WATCHDOG: Iniciando verificação de peso dos pedidos =====");

      await this.checkPesoPedidoUseCase.execute();

      const duration = Date.now() - startTime;
      console.log(`✅ ===== WATCHDOG: Tarefa concluída em ${duration}ms =====\n`);

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ ===== WATCHDOG: Erro ao executar tarefa: ${errorMessage} =====`);
      console.error(error);
      console.log(""); // Linha em branco para separar logs
    }
  }
}
