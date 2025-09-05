import { useEffect, useState } from "react";
import { osService } from "../services/osService";
import { mapToOsViewModel } from "../viewmodels/osViewModel";
import { OsViewModel } from "../types/osType";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import { OsCard } from "../components/osCard";

export const OsListView = () => {
  const [ordens, setOrdens] = useState<OsViewModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    osService.getAll()
      .then((data) => {
        console.log('Dados recebidos:', data);
        const mappedData = data.map(mapToOsViewModel) as OsViewModel[];
        setOrdens(mappedData);
      })
      .catch((err) => {
        console.error('Erro ao carregar OS:', err);
        setError('Erro ao carregar ordens de serviço');
      });
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-semibold text-lg mb-2 text-center sm:text-left">Ordens de Serviço</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center sm:text-left">
                {error}
              </div>
            )}
          </div>
          
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 mb-4">
          {ordens.length > 0 ? (
            ordens.map((os) => (
              <OsCard
                key={os.id}
                id={os.id}
                descricao={os.descricao}
                prioridade={os.prioridade}
                status={os.status}
                solicitante={os.solicitante}
                data_criacao={os.data_criacao}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              Nenhuma ordem de serviço encontrada
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OsListView;