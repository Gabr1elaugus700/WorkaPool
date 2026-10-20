-- Pedido apontado na volta. Nasce nulo: viagem já fechada não é reescrita.
ALTER TABLE "ConciliacaoViagemIbc" ADD COLUMN "numPed" TEXT;
