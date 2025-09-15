import { useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import VistoriasList from "../components/obtemVistorias";
import ButtonRegistrarVistoria from "../components/botaoRegistrarVistoria";
import ButtonCriarChecklist from "../components/botaoCriarChecklist";

export const OsListView = () => {
  // const [error, setError] = useState<string | null>(null);

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
      <div>
        <div className="mb-4 w-full max-w-3xl mx-auto">
          <h2 className="font-semibold text-lg mb-4 text-center">Ações</h2>
          <div className="flex flex-row gap-2 justify-center mb-6">
            <ButtonRegistrarVistoria descricao="Registrar Vistoria"/>
            <ButtonCriarChecklist descricao="Criar Checklist"/>
          </div>
          <div className="w-full">
            <VistoriasList />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OsListView;