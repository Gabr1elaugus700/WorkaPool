import { useEffect, useState } from "react";
import { osService } from "../services/osService";
import { mapToOsViewModel } from "../viewmodels/osViewModel";
import { OsViewModel } from "../types/osType";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import { OsCard } from "../components/osCard";

export const OsListView = () => {
  const [ordens, setOrdens] = useState<OsViewModel[]>([]);

  useEffect(() => {
    osService.getAll().then((data) => {
      const mappedData = data.map(mapToOsViewModel) as OsViewModel[];
      setOrdens(mappedData);
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
        <h2>Ordens de Serviço</h2>
        <div className="grid grid-cols-5 gap-4 mb-4">
          {ordens.map((os) => (
            <OsCard key={os.id} descricao={os.titulo} prioridade={os.prioridade} status={os.status} solicitante={os.solicitante} data_criacao="20-20-2020" />
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OsListView;