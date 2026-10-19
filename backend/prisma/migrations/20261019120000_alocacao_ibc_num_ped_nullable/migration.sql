-- O pedido da alocação nasce na volta. Linhas já gravadas conservam o numPed.
ALTER TABLE "AlocacaoIbc" ALTER COLUMN "numPed" DROP NOT NULL;
