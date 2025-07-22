import { useEffect, useState } from "react";
import { fetchVendedores } from "@/services/useVendedores";
import { Vendedor } from "@/types/Vendedor";
import { Link, useSearchParams, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VendedoresSection() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const idVendedor = pathParts[2];

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth = searchParams.get("mes") || String(new Date().getMonth() + 1);
  const selectedYear = searchParams.get("ano") || String(new Date().getFullYear());

  useEffect(() => {
    fetchVendedores().then(setVendedores).catch(console.error);
  }, []);

  const updateMonthYear = (mes: string, ano: string) => {
    searchParams.set("mes", mes);
    searchParams.set("ano", ano);
    setSearchParams(searchParams);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {vendedores.map((v) => {
          const isActive = String(idVendedor) === String(v.COD_REP);

          return (
            <Button
              asChild
              key={v.COD_REP}
              variant={isActive ? "default" : "outline"}
              className={`rounded-xl text-sm px-4 py-2 ${isActive ? "shadow font-semibold" : ""}`}
            >
              <Link to={`/metas/${v.COD_REP}?mes=${selectedMonth}&ano=${selectedYear}`}>
                {v.APE_REP}
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="flex gap-4 items-center flex-wrap justify-center">
        <label className="text-sm">Mês:</label>
        <Select value={selectedMonth} onValueChange={(value) => updateMonthYear(value, selectedYear)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
              <SelectItem key={mes} value={String(mes)}>
                {mes.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="text-sm">Ano:</label>
        <Select value={selectedYear} onValueChange={(value) => updateMonthYear(selectedMonth, value)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
              <SelectItem key={ano} value={String(ano)}>
                {ano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
