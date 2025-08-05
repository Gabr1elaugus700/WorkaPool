import { getRotas, rotaBase } from "@/services/useFretesService";

 
export async function garantirRotaBaseId(origem: string, destino: string, km: number, dias: number): Promise<number | null> {
    console.log("Garantindo rota base ID...");
    if (!origem || !destino || !km || !dias) {
      console.error("Parâmetros insuficientes para garantir rota base ID");
      return null;
    }
    const rotas = await getRotas();
    const rota = rotas.find((r) => r.destino === destino && r.origem === origem);
    if (rota) {
      const id = rota.id !== undefined ? Number(rota.id) : null;
      console.log("Rota já existe, usando ID:", id);
      return id;
    } else {
      const novaRota = await rotaBase(origem, destino, km, dias);
      const id = novaRota.id !== undefined ? Number(novaRota.id) : null;
      console.log("Nova rota criada, usando ID:", id);
      return id;
    }
  }