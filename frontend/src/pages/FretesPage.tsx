import DefaultLayout from "@/layout/DefaultLayout";
import CardCaminhoes from "@/components/fretes/CardCaminhoes";
import CadCaminhoes from "@/components/caminhoes/CadCaminhao";

export default function FretesPage() {
  return (
    <DefaultLayout>
      <div>
        <CadCaminhoes />
      </div>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Calculo de Fretes</h1>
        <p className="text-gray-600">Esta página está em desenvolvimento.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 p-6 ">
            <CardCaminhoes />
            <CardCaminhoes />
            <CardCaminhoes />
        </div>
      </div>
    </DefaultLayout>
  );
}