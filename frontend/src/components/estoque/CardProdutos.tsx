import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CardProps = {
  nome: string;
  estoque: number;
};

export function CardProduto({ nome, estoque }: CardProps) {
  return (
    <Card className="transition-shado bg-green-100 border-solid border-4 border-green-600/70 hover:shadow-lg flex-wrap justify-center items-center">
      <CardHeader className="display flex justify-center items-center">
        <CardTitle>{nome}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items">
        <p className="text-xl text-gray-950 flex justify-center mt-0">Estoque: {estoque.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} KG</p>
      </CardContent>
    </Card>
  );
}
