import DefaultLayout from "../layout/DefaultLayout";
import { useAuth } from "../auth/AuthContext";

const Home: React.FC = () => {
  
  const { user, loading } = useAuth(); // Adicione `loading` no contexto

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
        <span className="text-gray-600">
          Seu Codigo de Vendedeor: {user?.codRep || "N/A"}
        </span>

        <p className="text-gray-900">Esta é a página inicial.</p>

      </div>
    </DefaultLayout>
  );
};

export default Home;
