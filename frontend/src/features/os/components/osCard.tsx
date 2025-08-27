import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const OsCard = ({ descricao, status }: { descricao: string; status: string }) => (
  
    <Card className="p-6 bg-orange-500">
      <CardTitle>{descricao}</CardTitle>
      <CardDescription>{status}</CardDescription>
    </Card>
);
