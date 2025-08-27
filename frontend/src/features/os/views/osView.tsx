import { useEffect, useState } from "react";
import { osService } from "../services/osService";
import { mapToOsViewModel } from "../viewmodels/osViewModel";
import { OsCard } from "../components/osCard";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";


interface OsViewModel {
  id: string | number;
  titulo: string;
  prioridade: string;
}

export const OsListView = () => {
  const [ordens, setOrdens] = useState<OsViewModel[]>([]);

  useEffect(() => {
    osService.getAll().then((data) => {
      setOrdens(data.map(mapToOsViewModel));
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
            <OsCard key={os.id} descricao={os.titulo} status={os.prioridade} />
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OsListView;