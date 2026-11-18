import { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadRelatorioViagemPdf } from "../pdf/downloadRelatorioViagemPdf";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { toError } from "../utils/toError";

type Props = {
  codCar: number;
  rotulo: string;
  variant?: ButtonProps["variant"];
  aparencia?: "texto" | "pdf";
};

export default function ExportarRelatorioViagemButton({
  codCar,
  rotulo,
  variant = "outline",
  aparencia = "texto",
}: Props) {
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

  const pdf = aparencia === "pdf";

  return (
    <Button
      type="button"
      variant={variant}
      size={pdf ? "icon" : "sm"}
      className={pdf ? "border-destructive bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive" : undefined}
      disabled={gerando}
      aria-label={pdf ? (gerando ? "Gerando…" : rotulo) : undefined}
      onClick={() => {
        void exportar();
      }}
    >
      {pdf ? <Printer aria-hidden /> : gerando ? "Gerando…" : rotulo}
    </Button>
  );
}
