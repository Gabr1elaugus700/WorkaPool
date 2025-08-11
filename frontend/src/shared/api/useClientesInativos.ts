import { getBaseUrl } from "@/lib/apiBase";

interface FiltroClientesInativos {
  codRep: number;
  dataInicio: string; // formato: "YYYY-MM-DD"
  dataFim: string;    // formato: "YYYY-MM-DD"
  diasSCompra: number;
}

export const fetchClientesInativos = async ({
  codRep,
  dataInicio,
  dataFim,
  diasSCompra
}: FiltroClientesInativos) => {
  const response = await fetch(`${getBaseUrl()}/api/clientes-inativos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      codRep,
      dataInicio,
      dataFim,
      diasSCompra,
    }),
  });

  if (!response.ok) {
    throw new Error("(Service-FrontEnd) Erro ao buscar clientes inativos");
  }

  const data = await response.json();
  return data;
};
