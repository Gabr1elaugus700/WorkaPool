import { useEffect, useState } from "react";
import { osService } from "../services/osService";
import { mapToOsViewModel } from "../viewmodels/osViewModel";
import { OsViewModel } from "../types/osType";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import { OsCard } from "../components/osCard";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { Separator } from "@/components/ui/separator";
// import ReducerExemple from "../components/criarChecklist";

export const OsListView = () => {
  const [ordens, setOrdens] = useState<OsViewModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [modalCriarOsOpen, setModalCriarOsOpen] = useState(false);


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
      
      <div className="w-full mx-auto px-2 sm:px-4 bg-white/50">
        {/* <ReducerExemple /> */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-content-light dark:text-content-dark text-center">Ordens de Serviço</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
              {error}
            </div>
          )}
        </div>
        <Separator className="my-4 bg-[#17cf54]" />
        <div className="container mx-auto pb-28 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ordens.length > 0 ? (
            ordens.map((os) => (
              <div key={os.id} className="w-full">
                <OsCard
                  id={os.id}
                  descricao={os.descricao}
                  problema={os.problema}
                  prioridade={os.prioridade}
                  status={os.status}
                  solicitante={os.solicitante}
                  data_criacao={os.data_criacao}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              Tudo Livre por aqui! Sem ordens de serviço no momento.
            </div>
          )}
        </div>
        <FloatingActionButton onClick={() => setModalCriarOsOpen(true)} ariaLabel="Criar OS" />
      </div>
    </DefaultLayout>
  );
};

export default OsListView;