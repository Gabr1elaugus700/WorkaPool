import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardProps = {
  nome: string;
  estoque: number;
};

export function CardProduto({ nome, estoque }: CardProps) {
  return (
    <Card className="bg-muted border-2 border-gray-200 text-card-foreground rounded-lg p-3 shadow-sm">
      <CardHeader className="text-xl font-semibold">
        <CardTitle>{nome}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <p className="text-xl text-foreground mt-2">
          Estoque: {estoque.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} KG
        </p>
      </CardContent>
    </Card>

  );
}
