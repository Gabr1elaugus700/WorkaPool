import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/auth/AuthContext"

export function FiltrosInativos({
  onApply,
}: {
  onApply: (filtros: {
    codRep: number
    dataInicio: string
    dataFim: string
    diasSCompra: number
  }) => void
}) {
  const { user } = useAuth()

  const [dias, setDias] = useState(30)
  const [inicio, setInicio] = useState("2023-01-01")
  const [fim, setFim] = useState("2024-01-01")

  const codRep = user?.codRep ?? 0

  return (
    <div className="space-y-4 p-4 border rounded-xl mb-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Representante</Label>
          <Input type="number" value={codRep} disabled />
        </div>
        <div>
          <Label>Dias sem compra</Label>
          <Input
            type="number"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Data Início</Label>
          <Input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>
        <div>
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={() =>
          onApply({
            codRep,
            dataInicio: inicio,
            dataFim: fim,
            diasSCompra: dias,
          })
        }
      >
        Aplicar Filtros
      </Button>
    </div>
  )
}
