import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
// import ButtonCriarChecklist from "../components/ModalCriarChecklist";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { Separator } from "@/components/ui/separator"
import ModalCriarVistoria from "../components/ModalCriarChecklist";
import { VistoriasPorDepartamento } from "../components/VistoriasPorDepartamento";


export const VistoriaView = () => {
  const [modalCriarVistoriaOpen, setModalCriarVistoriaOpen] = useState(false);

  useEffect(() => {
    // Carregar dados de vistorias
  }, []);

  const { loading } = useAuth();
  if (loading) {
    return (
      <DefaultLayout>
        <div className="p-6 text-gray-700">Carregando usuário...</div>
      </DefaultLayout>
    );
  }

  return (

    <DefaultLayout>
      <div className="w-full min-h-screen flex flex-col items-center justify-start px-2 md:px-8 lg:px-24">
        <div className="w-full max-w-6xl  mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-content-light dark:text-content-dark text-center">Vistorias Por Departamentos</h2>
          <Separator className="my-4 bg-[#17cf54]" />
          <div className="flex flex-col md:flex-row gap-2 justify-center mb-6 w-full">
            {/* <ButtonRegistrarVistoria descricao="Registrar Vistoria"/> */}
            {/* <ButtonCriarChecklist descricao="Criar Checklist"/> */}
          </div>
          <div className="w-full">
            <VistoriasPorDepartamento />
          </div>
        </div>
        <FloatingActionButton onClick={() => setModalCriarVistoriaOpen(true)} ariaLabel="Criar Vistoria" />
        <ModalCriarVistoria
          descricao="Criar Checklist"
          open={modalCriarVistoriaOpen}
          setOpen={setModalCriarVistoriaOpen}
        />
      </div>
    </DefaultLayout>
  );
};

export default VistoriaView;