import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"

export function FiltrosInativos({ onApply }: {
  onApply: (filtros: {
    codRep: number
    dataInicio: string
    dataFim: string
    diasSCompra: number
  }) => void
}) {
  const [codRep, setCodRep] = useState(8)
  const [dias, setDias] = useState(30)
  const [inicio, setInicio] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)))
  const [fim, setFim] = useState(new Date())

  const format = (d: Date) => d.toISOString().split("T")[0]

  return (
    <div className="space-y-4 p-4 border rounded-xl mb-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Representante (código)</Label>
          <Input type="number" value={codRep} onChange={(e) => setCodRep(Number(e.target.value))} />
        </div>
        <div>
          <Label>Dias sem compra</Label>
          <Input type="number" value={dias} onChange={(e) => setDias(Number(e.target.value))} />
        </div>
        <div>
          <Label>Data Início</Label>
          <Calendar mode="single" selected={inicio} onSelect={(d) => d && setInicio(d)} />
        </div>
        <div>
          <Label>Data Fim</Label>
          <Calendar mode="single" selected={fim} onSelect={(d) => d && setFim(d)} />
        </div>
      </div>

      <Button onClick={() => onApply({
        codRep,
        dataInicio: format(inicio),
        dataFim: format(fim),
        diasSCompra: dias,
      })}>
        Aplicar Filtros
      </Button>
    </div>
  )
}
