import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { Carga } from '../../../../src/features/cargo/entities/Carga';
import { WatchdogScheduler } from '../../../../src/schedulers/watchdog/WatchdogScheduler';

describe('WatchdogScheduler overlap', () => {
  it('ignora tick concorrente e libera o próximo após concluir', async () => {
    let liberarPrimeiroTick: (() => void) | undefined;
    let confirmarInicio: (() => void) | undefined;
    const primeiroTickIniciado = new Promise<void>((resolve) => {
      confirmarInicio = resolve;
    });
    const primeiroTickPendente = new Promise<void>((resolve) => {
      liberarPrimeiroTick = resolve;
    });
    let execucoes = 0;
    const execute = mock.fn(async (): Promise<Carga[]> => {
      execucoes += 1;
      if (execucoes === 1) {
        confirmarInicio?.();
        await primeiroTickPendente;
      }

      return [];
    });
    const scheduler = new WatchdogScheduler({
      checkPesoPedidoUseCase: { execute },
    });

    const primeiroTick = scheduler.tick();
    await primeiroTickIniciado;
    await scheduler.tick();

    assert.strictEqual(execute.mock.calls.length, 1);

    liberarPrimeiroTick?.();
    await primeiroTick;
    await scheduler.tick();

    assert.strictEqual(execute.mock.calls.length, 2);
  });
});
