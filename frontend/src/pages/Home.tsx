import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../auth/AuthContext";
import { EstoqueList } from "@/features/estoque/EstoqueList";

const Home: React.FC = () => {

  const { user, loading } = useAuth();
  if (loading || !user) {
    return (
      <DefaultLayout>
        <div className="p-6 text-gray-700">Carregando usuário...</div>
      </DefaultLayout>
    );
  }


  return (

    <DefaultLayout>
      <div className="flex flex-col sshadow-lg py-4 px-6 rounded-md space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">
          🏠 Bem-vindo ao WorkaPool, {user?.name}!
        </h1>
        <EstoqueList />
      </div>


    </DefaultLayout>
  );
};

export default Home;
