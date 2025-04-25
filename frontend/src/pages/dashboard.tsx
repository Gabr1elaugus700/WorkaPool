import DefaultLayout from "../layout/DefaultLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from '../components/ui/table'

const faturamentoDiario = [
    { dia: "01", valor: 1200 },
    { dia: "02", valor: 1900 },
    { dia: "03", valor: 800 },
    { dia: "04", valor: 1400 },
    { dia: "05", valor: 2000 },
]

const produtosMaisVendidos = [
    { nome: "Produto A", vendas: 40 },
    { nome: "Produto B", vendas: 30 },
    { nome: "Produto C", vendas: 20 },
    { nome: "Produto D", vendas: 10 },
]

const clientesTop = [
    { nome: "Cliente X", valor: 5200 },
    { nome: "Cliente Y", valor: 4100 },
    { nome: "Cliente Z", valor: 3900 },
]

const cores = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B"]

export default function Dashboard() {
    return (
        <DefaultLayout>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 border-2">
            {/* Meta vs Realizado */}
            <Card className="col-span-1 md:col-span-2 xl:col-span-3 bg-slate-300 ">
                <CardHeader>
                    <CardTitle>Meta de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Meta: R$ 10.000</p>
                    <p className="text-lg font-semibold mb-2">Realizado: R$ 6.500</p>
                    <Progress className="bg-slate-400 [&>div]:bg-emerald-500" value={65}  />
                </CardContent>
            </Card>

            {/* Faturamento por dia */}
            <Card className="col-span-1 xl:col-span-2 bg-slate-300">
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

            {/* Produtos mais vendidos */}
            <Card className="bg-slate-300">
                <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={produtosMaisVendidos}
                                dataKey="vendas"
                                nameKey="nome"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {produtosMaisVendidos.map((_, index) => (
                                    <Cell key={index} fill={cores[index % cores.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Clientes top */}
            <Card className="bg-slate-300">
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
    )
}
