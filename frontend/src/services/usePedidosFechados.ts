const API = import.meta.env.VITE_API_URL;

export type PedidoAgrupado = {
  numPed: string;
  cliente: string;
  cidade: string;
  vendedor: string;
  produtos: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
  pesoTotal: number;
  codCar?: number | null;
  posCar?: number | null; // Posição do pedido na carga	
  sitCar?: string | null; // Situação do pedido na carga
};

type RawItem = {
  NUM_PED: number;
  CLIENTE: string;
  CIDADE: string;
  VENDEDOR: string;
  PESO: number;
  DERIVACAO: string;
  PRODUTOS: string;
  CODCAR: number | null;
  POSCAR?: number | null; // Posição do Pedido na Carga
  SITCAR?: string | null; // Situação Do pedido na carga 
};

export const fetchPedidosFechados = async (codRep: number): Promise<PedidoAgrupado[]> => {
  const response = await fetch(`${API}/api/pedidosFechados?codRep=${codRep}`);
  if (!response.ok) throw new Error('Erro ao buscar pedidos');

  const data: RawItem[] = await response.json();

  const agrupado = new Map<number, PedidoAgrupado>();

  data.forEach((item) => {
    const numPed = item.NUM_PED;

    if (!agrupado.has(numPed)) {
      agrupado.set(numPed, {
        numPed: String(numPed),
        cliente: item.CLIENTE,
        cidade: item.CIDADE,
        vendedor: item.VENDEDOR,
        produtos: [{
          nome: item.PRODUTOS,
          derivacao: item.DERIVACAO,
          peso: item.PESO,
        }],
        pesoTotal: item.PESO,
        codCar: item.CODCAR ?? null,
        posCar: item.POSCAR ?? null,
        sitCar: item.SITCAR ?? null 
      });
    } else {
      const existente = agrupado.get(numPed)!;
      existente.produtos.push({
        nome: item.PRODUTOS,
        derivacao: item.DERIVACAO,
        peso: item.PESO,
      });
      existente.pesoTotal += item.PESO;
    }
  });

  return Array.from(agrupado.values());
};
