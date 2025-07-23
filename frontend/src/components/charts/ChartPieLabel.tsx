import { Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"


type ChartPieLabelProps = {
  title?: string
  description?: string
  data: {
    label: string
    value: number
  }[]
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function ChartPieLabel({ title, description, data }: ChartPieLabelProps) {
  const chartData = data.map((item, index) => ({
    label: item.label,
    value: item.value,
    fill: colors[index % colors.length],
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title ?? "Gráfico"}</CardTitle>
        <CardDescription>{description ?? ""}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 ">
        <ChartContainer
          config={{}}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[300px] mt-3 p-6 "
        >
          <PieChart className="">
            <ChartTooltip content={<ChartTooltipContent hideIndicator labelKey="label"  />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              outerRadius={80}
              label={({ value }) => value.toLocaleString("pt-BR")}
              labelLine={false}
            />

            <ChartLegend
              content={<ChartLegendContent nameKey="label" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center mt-4 p-4"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
