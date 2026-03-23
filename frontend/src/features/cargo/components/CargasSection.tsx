import { Carga, CargaSituacao } from "../types/cargo.types";
import { UserRole } from "../types/roles.types";
import CargaDropzone from "./CargaDropzone";
import PedidoCard from "./PedidoCard";
import { FiltroCarga } from "./FiltroCargas";
import CargasFechadas from "./CargasFechadas";
import { NovaCargaModal } from "./NovaCargaModal";
import { canEditCarga, getPedidoViewMode } from "../utils/permissions";

type Props = {
  cargas: Carga[];
  destinosFiltrados: string[];
  onFiltroChange: (destinos: string[]) => void;
  onNovaCarga: (novaCarga: Carga) => void;
  onChangeSituacao: (id: string, novaSituacao: CargaSituacao) => void;
  onUpdate: (cargaAtualizada: Carga) => void;
  userRole?: UserRole;
  codRepUsuarioLogado?: number;
  todasCargas: Carga[];
};

/**
 * Seção que exibe as cargas com filtros e ações
 */
export default function CargasSection({
  cargas,
  destinosFiltrados,
  onFiltroChange,
  onNovaCarga,
  onChangeSituacao,
  onUpdate,
  userRole,
  codRepUsuarioLogado,
  todasCargas,
}: Props) {
  return (
    <div className="col-span-3 bg-card p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center h-14 mb-4 px-2">
        <h1 className="text-2xl font-bold text-foreground">
          Cargas
          {destinosFiltrados.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({destinosFiltrados.join(", ")})
            </span>
          )}
        </h1>

        <div className="flex items-center gap-2">
          <FiltroCarga
            cargas={todasCargas}
            onFiltroChange={onFiltroChange}
          />

          {canEditCarga(userRole) && <CargasFechadas />}

          <NovaCargaModal
            onCreated={(nova) =>
              onNovaCarga({
                id: nova.id,
                codCar: nova.codCar,
                destino: nova.destino,
                pesoMaximo: nova.pesoMaximo,
                pesoAtual: nova.pesoAtual || 0,
                previsaoSaida: nova.previsaoSaida,
                situacao: nova.situacao as CargaSituacao,
                createdAt: nova.createdAt,
                closedAt: nova.closedAt,
                pedidos: [],
              })
            }
          />
        </div>
      </div>

      {cargas
        .sort((a, b) => {
          const prioridade = ["SOLICITADA", "ABERTA"];
          const indexA = prioridade.indexOf(a.situacao);
          const indexB = prioridade.indexOf(b.situacao);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;

          return a.situacao.localeCompare(b.situacao);
        })
        .map((carga) => (
          <CargaDropzone
            key={carga.id}
            carga={carga}
            onChangeSituacao={onChangeSituacao}
            onUpdate={onUpdate}
            userRole={userRole}
            codRepUsuarioLogado={codRepUsuarioLogado}
          >
            {carga.pedidos
              .slice()
              .sort((a, b) => (a.poscar ?? 0) - (b.poscar ?? 0))
              .map((pedido) => {
                const viewMode = getPedidoViewMode(
                  userRole,
                  codRepUsuarioLogado,
                  pedido.codRep
                );
                const isDraggable = viewMode === "full";

                return (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    produtos={pedido.produtos || []}
                    destaque={codRepUsuarioLogado !== pedido.codRep}
                    viewMode={viewMode}
                    isDraggable={isDraggable}
                    compact={true}
                    codRepUsuarioLogado={codRepUsuarioLogado || 999}
                  />
                );
              })}
          </CargaDropzone>
        ))}
    </div>
  );
}
