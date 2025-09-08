import { useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import VistoriasList from "../components/obtemVistorias";

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
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-lg mb-1 text-center sm:text-left">Ações</h2>
            <div className="flex gap-2 justify-center p-2 rounded">
              <Button variant="mobile" onClick={() => {/* Navegar para criar vistoria */ }}>
                Agendar
              </Button>
              <Button variant="mobile" onClick={() => {/* Navegar para criar vistoria */ }}>
                Registrar
              </Button>
              <Button variant="mobile" onClick={() => {/* Navegar para criar vistoria */ }}>
                Criar
              </Button>
            </div>
            {/* {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center sm:text-left">
                {error}
              </div>
            )} */}
            <VistoriasList />
          </div>
        </div>

      </div>
    </DefaultLayout>
  );
};

export default OsListView;