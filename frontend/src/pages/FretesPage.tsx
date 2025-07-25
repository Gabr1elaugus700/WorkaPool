import DefaultLayout from "@/layout/DefaultLayout";
import CadCaminhoes from "@/components/caminhoes/CadCaminhao";
import CadParametros from "@/components/caminhoes/CadParametros";
import CardCaminhoes from "@/components/caminhoes/CardsCaminhao";

export default function FretesPage() {
  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-start items-center mb-6 gap-4">
          <CadCaminhoes />
          <CadParametros />
        </div>
        <div>
          <CardCaminhoes />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 p-6 ">

        </div>
      </div>
    </DefaultLayout>
  );
}