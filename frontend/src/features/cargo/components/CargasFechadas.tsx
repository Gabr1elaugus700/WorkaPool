import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
} from "@/components/ui/dialog";
import { cargoService } from "../services/cargoService";
import type { CargaFechadaData } from "../types/cargo.types";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  MapPin,
  Weight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CargasFechadas() {
  const [open, setOpen] = useState(false);
  const [cargasFechadas, setCargasFechadas] = useState<CargaFechadaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCarga, setExpandedCarga] = useState<string | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (open) {
      loadCargasFechadas();
    }
  }, [open]);

  const loadCargasFechadas = async () => {
    try {
      setLoading(true);
      const response = await cargoService.getCargasFechadas();
      setCargasFechadas(response);
    } catch (error) {
      console.error("Erro ao carregar cargas fechadas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de paginação
  const totalPages = Math.ceil(cargasFechadas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = cargasFechadas.slice(startIndex, endIndex);

  const toggleExpand = (id: string) => {
    setExpandedCarga(expandedCarga === id ? null : id);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const calcularPesoTotal = (pedidos: CargaFechadaData["pedidos"]): number => {
    return pedidos.reduce((acc, p) => acc + p.peso, 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Cargas Fechadas</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Histórico de Cargas Fechadas
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-4" />

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : cargasFechadas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhuma carga fechada encontrada.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentItems.map((cargaFechada) => {
                const isExpanded = expandedCarga === cargaFechada.id;
                const pesoTotal = calcularPesoTotal(cargaFechada.pedidos);
                const percentualPeso =
                  (pesoTotal / cargaFechada.carga.pesoMaximo) * 100;

                return (
                  <div
                    key={cargaFechada.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Header do Card */}
                    <div
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleExpand(cargaFechada.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Destino */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Destino</p>
                              <p className="font-semibold">
                                {cargaFechada.carga.destino}
                              </p>
                            </div>
                          </div>

                          {/* Pedidos */}
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500">Pedidos</p>
                              <p className="font-semibold">
                                {cargaFechada.pedidos.length}
                              </p>
                            </div>
                          </div>

                          {/* Peso */}
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="text-xs text-gray-500">Peso</p>
                              <p className="font-semibold">
                                {pesoTotal.toFixed(1)}kg /{" "}
                                {cargaFechada.carga.pesoMaximo}kg
                              </p>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    percentualPeso > 100
                                      ? "bg-red-500"
                                      : percentualPeso > 90
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(percentualPeso, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Data de Fechamento */}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-xs text-gray-500">Fechada</p>
                              <p className="font-semibold text-sm">
                                {formatDistanceToNow(
                                  new Date(cargaFechada.carga.closedAt),
                                  {
                                    addSuffix: true,
                                    locale: ptBR,
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ícone de expansão */}
                        <div className="ml-4">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo Expandido - Tabela de Pedidos */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t">
                        <h4 className="font-semibold mb-3 text-sm text-gray-700">
                          Pedidos da Carga
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left">Pedido</th>
                                <th className="px-4 py-2 text-left">
                                  Vendedor
                                </th>
                                <th className="px-4 py-2 text-left">Cliente</th>
                                <th className="px-4 py-2 text-right">
                                  Peso (kg)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {cargaFechada.pedidos.map((pedido) => (
                                <tr
                                  key={pedido.numPed}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-4 py-2 font-medium">
                                    #{pedido.numPed}
                                  </td>
                                  <td className="px-4 py-2">
                                    {pedido.nomeVendedor}
                                  </td>
                                  <td className="px-4 py-2">
                                    {pedido.razaoCli}
                                  </td>
                                  <td className="px-4 py-2 text-right font-semibold">
                                    {pedido.peso.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-semibold">
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-2 text-right"
                                >
                                  Total:
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {pesoTotal.toFixed(2)} kg
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} ({cargasFechadas.length}{" "}
                  cargas no total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
