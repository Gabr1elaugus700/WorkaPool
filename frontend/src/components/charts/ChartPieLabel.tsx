// src/charts/ChartPieLabel.tsx

"use client"
import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts"


type ProdutoEstoque = {
  PRODUTO: string
  ESTOQUE: number
}

type Props = {
  produtos: ProdutoEstoque[]
}



export function ChartPieLabel({ produtos }: Props) {
  const chartData = produtos.map((item, index) => ({
    browser: item.PRODUTO, // Renomeando para `browser` pois o componente espera isso
    visitors: item.ESTOQUE,
    fill: `var(--chart-${(index % 5) + 1})`, // gera cores variando
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Estoque - Pizza</CardTitle>
        <CardDescription>Distribuição por produto</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              label
              fill="#888234"
            />
          </PieChart>
        </ResponsiveContainer>

      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Dados atualizados <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Produtos em estoque
        </div>
      </CardFooter>
    </Card>
  )
}
