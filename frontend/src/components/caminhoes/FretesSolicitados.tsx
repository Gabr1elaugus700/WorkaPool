"use client";

import { useEffect, useState } from "react";
import { getRotasSolicitadas } from "@/services/fretesService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import clsx from "clsx";

type SolicitacaoFrete = {
  id?: string;
  origem: string;
  destino: string;
  peso: number;
  status: string;
  solicitante_user: string;
};

const statusBgClasses: Record<string, string> = {
  PENDENTE: "bg-yellow-50 border-yellow-400",
  APROVADA: "bg-green-50 border-green-600",
  REJEITADA: "bg-red-50 border-red-600",
}; 

const statusBadgeClasses: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700",
  APROVADA: "bg-green-100 text-green-700",
  REJEITADA: "bg-red-100 text-red-700",
};

export default function RotasSolicitadasList() {
  const [rotas, setRotas] = useState<SolicitacaoFrete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getRotasSolicitadas();
        setRotas(data);
      } catch (err) {
        console.error("Erro ao carregar rotas:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (rotas.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhuma rota pendente</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rotas.map((rota) => (
        <Card
          key={rota.id}
          className={clsx(
            "border-2 transition-all hover:shadow-lg",
            statusBgClasses[rota.status] || "bg-white border-gray-300"
          )}
        >
          <CardHeader>
            <Pencil />
            <div className="flex justify-between items-start">
              
              <CardTitle className="text-lg font-bold">
                {rota.origem} → {rota.destino}
              </CardTitle>
              <span
                className={clsx(
                  "text-xs px-2 py-1 rounded font-semibold",
                  statusBadgeClasses[rota.status]
                )}
              >
                {rota.status}
                
              </span>
            </div>
            <CardDescription>
              Solicitado por: <strong>{rota.solicitante_user}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Peso: {rota.peso} kg
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
