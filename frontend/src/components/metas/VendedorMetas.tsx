import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchVendedores } from "@/services/useVendedores";
import { fetchProdutos } from "@/services/useProdutos";
import { Vendedor } from "@/types/Vendedor";
import { getBaseUrl } from '@/lib/apiBase';
import { Button } from "../ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// import { fetchMetasPorVendedorMesAno } from "@/services/useMetas"; ← depois

type ProdutoBase = {
  COD_GRUPO: string;
  PRODUTOS: string;
};

export default function VendedorMetas() {
  const { idVendedor } = useParams();
  const [searchParams] = useSearchParams();
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");

  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [produtos, setProdutos] = useState<ProdutoBase[]>([]);
  const [metas, setMetas] = useState<{ [codGrupo: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idVendedor || !mes || !ano) return;

    const carregar = async () => {
      try {
        const [vendedores, produtos] = await Promise.all([
          fetchVendedores(),
          fetchProdutos(),
        ]);

        const v = vendedores.find((v) => String(v.COD_REP) === idVendedor);
        if (!v) return;

        setVendedor(v);
        setProdutos(produtos);

        const res = await fetch(`${getBaseUrl()}/api/metas?codRep=${idVendedor}&mesMeta=${mes}&anoMeta=${ano}`);

        if (!res.ok) throw new Error("Erro ao buscar metas");

        const metasSalvas = await res.json();

        type Meta = { produto: string; metaProduto: string };
        const metasMap: { [codGrupo: string]: string } = {};
        metasSalvas.forEach((meta: Meta) => {
          metasMap[meta.produto] = meta.metaProduto;
        });
        setMetas(metasMap);

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [idVendedor, mes, ano]);

  const handleMetaChange = (codGrupo: string, value: string) => {
    setMetas((prev) => ({ ...prev, [codGrupo]: value }));
  };

  if (loading) return <p>Carregando...</p>;
  if (!vendedor) return <p>Vendedor não encontrado.</p>;

  const salvarMetas = async () => {
    const metasArray = Object.entries(metas).map(([produto, metaProduto]) => ({
      produto,
      metaProduto: parseInt(metaProduto || "0", 10),
    }));

    const payload = {
      codRep: parseInt(idVendedor!, 10),
      mesMeta: parseInt(mes!, 10),
      anoMeta: parseInt(ano!, 10),
      metas: metasArray,
    };

    try {
      const res = await fetch(`${getBaseUrl()}/api/metas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      alert("✅ Metas salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao salvar metas.");
    }
  };


  return (
    <div className="mt-6 col-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold mb-4">
          Metas de <span className="text-primary">{vendedor.APE_REP}</span> – no Mês: {mes} de: {ano}
        </h1>
        <Button
          onClick={salvarMetas}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition"
        >
          Salvar Metas
        </Button>
      </div>
      <div className="w-full flex justify-start">
        <div className="w-full max-w-2xl overflow-auto border rounded-lg">
          <Table className="min-w-full border-collapse">
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="text-left px-4 py-2">Produto</TableHead>
                <TableHead className="text-center px-4 py-2">Meta (kg)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {produtos.map((p, i) => (
                <TableRow key={p.COD_GRUPO} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                  <TableCell className="px-4 py-2">{p.PRODUTOS}</TableCell>
                  <TableCell className="px-2 py-1">
                    <input
                      type="number"
                      className="w-full rounded border px-2 py-1 text-center"
                      value={metas[p.COD_GRUPO] || ""}
                      onChange={(e) => handleMetaChange(p.COD_GRUPO, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
