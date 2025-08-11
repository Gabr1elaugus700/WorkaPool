import { Route, Routes } from "react-router-dom";
import VendedoresSection from "@/features/metas/vendedoresSection";
import VendedorMetas from "@/features/metas/VendedorMetas";
import DefaultLayout from "@/layout/DefaultLayout";

export default function MetasPage() {
  return (
  <DefaultLayout>
    <div className="p-4">
      <VendedoresSection />

      <Routes>
        <Route path="/" element={<SemVendedorSelecionado />} />
        <Route path=":idVendedor" element={<VendedorMetas />} />
      </Routes>
    </div>
    </DefaultLayout>
  );
}

function SemVendedorSelecionado() {
  return (
    
      <div className="mt-6 text-center text-gray-500">
        🔍 Selecione um vendedor para visualizar as metas.
      </div>
    
  );
}
