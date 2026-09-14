import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  rows?: number;
};

/**
 * Placeholder de carregamento por seção no Cadastro IBC (DESIGN.md).
 */
export default function CadastroIbcSectionSkeleton({ rows = 4 }: Props) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}
