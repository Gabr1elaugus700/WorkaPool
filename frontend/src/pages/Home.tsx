import DefaultLayout from "../layout/DefaultLayout";

const Home: React.FC = () => {


  return (
    <DefaultLayout>
      <div className="flex flex-col sshadow-lg py-4 px-6 rounded-md space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">🏠 Bem-vindo ao WorkaPool!</h1>
        <p className="text-gray-900">Esta é a página inicial.</p>

      </div>
    </DefaultLayout>
  );
};

export default Home;
