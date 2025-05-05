import { useEffect, useState } from 'react';
import { fetchFaturamento } from '../services/useFatVendedor';
import { fetchRankingProdutos } from '../services/useTotalProdutos'
import DefaultLayout from '../layout/DefaultLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from '../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { PieFaturamento } from '../components/charts/PieFaturamento'

const faturamentoDiario = [
  { dia: "01", valor: 1200 },
  { dia: "02", valor: 1900 },
  { dia: "03", valor: 800 },
  { dia: "04", valor: 1400 },
  { dia: "05", valor: 2000 },
]

const clientesTop = [
  { nome: "Cliente X", valor: 5200 },
  { nome: "Cliente Y", valor: 4100 },
  { nome: "Cliente Z", valor: 3900 },
]

//const cores = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B"]

export default function Dashboard() {
  // Faturamento e Volume
  const [totalFaturado, setTotalFaturado] = useState<number>(0);
  const [totalkg, setTotalkg] = useState<number>(0);
  const [vendedor, setVendedor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [produtosVendidos, setProdutosVendidos] = useState<{ PRODUTO: string; QUANT: number }[]>([]);
  const [topCount, setTopCount] = useState<number>(10);


  useEffect(() => {
    const carregarFaturamento = async () => {
      try {
        const codRep = 75;
        const dataInicio = '2025-04-01';

        const { total, vendedor, totalkg } = await fetchFaturamento(codRep, dataInicio);
        setTotalFaturado(total);
        setVendedor(vendedor);
        setTotalkg(totalkg);
      } catch (error) {
        console.error('Erro ao carregar faturamento:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarFaturamento();
  }, []);

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const codRep = 75;
        const dataInicio = '2025-04-01';

        const data = await fetchRankingProdutos(codRep, dataInicio, topCount);

        setProdutosVendidos(data);
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
      }
    };

    carregarProdutos();
  }, [topCount]);


  //Carregando
  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }


  return (
    <DefaultLayout>
      <div className="p-6 grid grid-cols-5 md:grid-cols-2 xl:grid-cols-4 gap-1 border-2">
        <h1 className="text-2xl font-bold mb-4 col-span-5">Veja Seu desempenho, {vendedor}:</h1>

        <Card className="bg-slate-300 col-span-2 md:col-span-4  ">
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-36">

            <p className="text-2xl font-bold mt-2">
              {totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text font-bold mt-2">
              Volume Vendido: {totalkg.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <Progress className="bg-slate-400 [&>div]:bg-emerald-500 mt-2" value={65} />
          </CardContent>
        </Card>
        <Card className="col-span-2 xl:col-span-4">
            <CardContent>
              <PieFaturamento />
            </CardContent>
          </Card>
        <Card className="bg-slate-300 xl:col-span-2">
          <CardHeader>

            <div className="flex items-center justify-between mb-4">
              <CardTitle>Top {topCount} Produtos Mais Vendidos</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">Mostrar Top:</span>
                <Select
                  onValueChange={(value) => setTopCount(Number(value))}
                  defaultValue={topCount.toString()}
                >
                  <SelectTrigger className="w-[60px] h-8 text-sm px-1">
                    <SelectValue placeholder="Qtd" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosVendidos.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}º</TableCell>
                    <TableCell>{item.PRODUTO ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {item.QUANT !== undefined
                        ? item.QUANT.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Produtos mais vendidos */}

        {/* Faturamento por dia */}
        <Card className="col-span-2 xl:col-span-4 bg-slate-300">
          <CardHeader>
            <CardTitle>Faturamento Diário</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoDiario}>
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>



        {/* Clientes top */}
        <Card className="bg-slate-300 xl:col-span-4">
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesTop.map((cliente, index) => (
                  <TableRow key={index}>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell>R$ {cliente.valor.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}
