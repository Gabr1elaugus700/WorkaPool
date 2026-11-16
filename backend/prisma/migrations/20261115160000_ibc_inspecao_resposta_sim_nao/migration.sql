-- AlterTable: inspeção snapshot pode não ter mínimos (checklist só sim/não)
ALTER TABLE "IbcInspecao" ALTER COLUMN "notaMinimaCritico" DROP NOT NULL;
ALTER TABLE "IbcInspecao" ALTER COLUMN "mediaMinima" DROP NOT NULL;

-- AlterTable: snapshot por resposta (numérico + sim/não)
ALTER TABLE "IbcInspecaoResposta" ADD COLUMN "tipo" "ChecklistItemTipo" NOT NULL DEFAULT 'NUMERICO';
ALTER TABLE "IbcInspecaoResposta" ALTER COLUMN "nota" DROP NOT NULL;
ALTER TABLE "IbcInspecaoResposta" ADD COLUMN "resposta" "ChecklistItemRespostaEsperada";
ALTER TABLE "IbcInspecaoResposta" ADD COLUMN "respostaEsperada" "ChecklistItemRespostaEsperada";
ALTER TABLE "IbcInspecaoResposta" ADD COLUMN "bloqueante" BOOLEAN;
ALTER TABLE "IbcInspecaoResposta" ADD COLUMN "observacao" TEXT;