import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClienteInativo {
  codcli: number
  nomcli: string
  foncli: string
  vendedor: string
  codrep: number
  produto: string
  qtd_total: number
}

export function ClientesInativosTable({
  data,
  loading,
}: {
  data: ClienteInativo[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>KG Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={`${item.codcli}-${item.produto}`}>
              <TableCell>{item.nomcli}</TableCell>
              <TableCell>{item.produto}</TableCell>
              <TableCell>{item.foncli}</TableCell>
              <TableCell>{item.vendedor}</TableCell>
              <TableCell>{item.qtd_total.toLocaleString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
