export default function CardCaminhoes() {
  return (
    <div className="bg-green-100 shadow-md rounded-lg p-4 w-full max-w-md mx-auto border-2 border-gray-800 border-solid ">
      <h1 className="text-3xl font-semibold mb-4 flex justify-center">Truck</h1>
      {/* <p className="text-gray-600">Esta seção está em desenvolvimento.</p> */}
      <div className="mt-4">
        <h3>Destino:</h3> <p className="text-gray-500">São Paulo</p>
        <h3>KM:</h3> <p className="text-gray-500">500km</p>
        <h3>Duração viagem:</h3> <p className="text-gray-500">4 dias</p>
        <h3>Pedágios:</h3> <p className="text-gray-500">15 Praças - R$ 150,00</p>
        <h3>Preço Diesel Considerado:</h3> <p className="text-gray-500">R$ 6,00</p>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <h3 className="mt-4">Custo Operacional Cobrado:</h3>
        <p className="text-green-500 font-bold text-3xl">R$ 1.200,00</p>
      </div>
    </div>
  );
}