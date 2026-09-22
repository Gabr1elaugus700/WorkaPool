import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, FileDown } from "lucide-react";
import { Link } from "react-router-dom";

type OverviewCustomerDetailPageHeaderProps = {
  tradeName: string;
  customerCode: number;
};

export function OverviewCustomerDetailPageHeader({
  tradeName,
  customerCode,
}: OverviewCustomerDetailPageHeaderProps) {
  return (
    <header className="space-y-2">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/overview/customers" className="hover:text-foreground">
              Carteira de clientes
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{tradeName}</li>
        </ol>
      </nav>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Análise Comercial 360°</h1>
          <p className="text-sm text-muted-foreground">
            Cliente #{customerCode} · {tradeName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button type="button" variant="outline" className="gap-2" disabled>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Exportar relatório
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Em breve</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button type="button" variant="outline" className="gap-2" asChild>
            <Link to="/overview/customers">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar para carteira
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
