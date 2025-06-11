import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardProps = {
  nome: string;
  estoque: number;
};

export function CardProduto({ nome, estoque }: CardProps) {
  return (
    <Card className="transition-shado bg-emerald-600/30 border-solid border-4 border-emerald-500/25 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex justify-center">{nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-md text-gray-950 font-mono flex justify-center mt-0">Estoque: {estoque.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} KG</p>
      </CardContent>
    </Card>
  );
}
