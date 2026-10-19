import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadRelatorioViagemPdf } from "../pdf/downloadRelatorioViagemPdf";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { toError } from "../utils/toError";

type Props = {
  codCar: number;
  rotulo: string;
  variant?: ButtonProps["variant"];
};

export default function ExportarRelatorioViagemButton({ codCar, rotulo, variant = "outline" }: Props) {
  const [gerando, setGerando] = useState(false);

  const exportar = async () => {
    setGerando(true);
    try {
      const relatorio = await ibcExpedicaoService.getRelatorioViagem(codCar);
      await downloadRelatorioViagemPdf(relatorio);
    } catch (err: unknown) {
      toast.error(toError(err).message || "Falha ao gerar o relatório de viagem");
    } finally {
      setGerando(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={gerando}
      onClick={() => {
        void exportar();
      }}
    >
      {gerando ? "Gerando…" : rotulo}
    </Button>
  );
}
