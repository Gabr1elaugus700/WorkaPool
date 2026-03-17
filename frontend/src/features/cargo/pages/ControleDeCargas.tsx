import { useEffect } from "react";
import { DndContext } from "@dnd-kit/core";

import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { UserRole } from "../types/roles.types";

import { useCargasManager } from "../hooks/useCargasManager";
import {
  CargasPageHeader,
  PedidosSection,
  CargasSection,
} from "../components";

export default function ControleDeCargas() {
  const { user } = useAuth();

  const {
    pedidos,
    cargas,
    loading,
    destinosFiltrados,
    setDestinosFiltrados,
    carregar,
    handleDragEnd,
    handleChangeSituacao,
    cargasFiltradas,
    setCargas,
  } = useCargasManager(user?.role as UserRole, user?.codRep);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDragEnd}>
        <CargasPageHeader />
        
        <div className="grid grid-cols-5 gap-6 p-6">
          <div className="col-span-2">
            <PedidosSection 
              pedidos={pedidos} 
              loading={loading}
              userRole={user?.role as UserRole}
            />
          </div>

          <CargasSection
            cargas={cargasFiltradas}
            todasCargas={cargas}
            destinosFiltrados={destinosFiltrados}
            onFiltroChange={setDestinosFiltrados}
            onNovaCarga={(nova) => setCargas((prev) => [...prev, nova])}
            onChangeSituacao={handleChangeSituacao}
            onUpdate={(cargaAtualizada) => {
              setCargas((prev) =>
                prev.map((c) =>
                  c.id === cargaAtualizada.id ? cargaAtualizada : c
                )
              );
            }}
            userRole={user?.role as UserRole}
            userCodRep={user?.codRep}
          />
        </div>
      </DndContext>
    </DefaultLayout>
  );
}
