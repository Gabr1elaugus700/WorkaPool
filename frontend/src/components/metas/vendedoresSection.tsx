import { useEffect, useState } from "react";
import { fetchVendedores } from "@/services/useVendedores";
import { Vendedor } from "@/types/Vendedor";
import { Link, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";


export default function VendedoresSection() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const idVendedor = pathParts[2]; // "/metas/22" → ["", "metas", "22"]

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
      <div>
        <div className="flex flex-wrap gap-3 justify-center">
          {vendedores.map((v) => {
            const isActive = String(idVendedor) === String(v.COD_REP);


            return (
              <Link
                key={v.COD_REP}
                to={`/metas/${v.COD_REP}?mes=${selectedMonth}&ano=${selectedYear}`}
                className={`px-4 py-2 rounded-xl border text-sm transition-all ${isActive
                  ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {v.APE_REP}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap justify-center">
        <label className="text-sm">Mês:</label>
        <select
          value={selectedMonth}
          onChange={(e) => updateMonthYear(e.target.value, selectedYear)}
          className="border rounded px-2 py-1 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
            <option key={mes} value={mes}>
              {mes.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <label className="text-sm">Ano:</label>
        <select
          value={selectedYear}
          onChange={(e) => updateMonthYear(selectedMonth, e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      </div>
    </div>

  );
}
