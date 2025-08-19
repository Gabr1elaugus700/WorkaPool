import { useEffect, useState } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import CadCaminhoes from "@/components/caminhoes/CadCaminhao";
import CadParametros from "@/components/caminhoes/CadParametros";
import CardCaminhoes from "@/components/caminhoes/CardsCaminhao";
import { SearchSelect, SolicitacaoFrete } from "@/components/caminhoes/Filtro";
import { getRotas } from "@/services/useFretesService";
import { Separator } from "@/components/ui/separator";
import SolicitarFreteModal from "@/components/caminhoes/SolicitarFreteModal";
import RotasSolicitadasList from "@/components/caminhoes/FretesSolicitados";
import { CalculoRotaVendedor } from "@/components/caminhoes/CalculoVendedor";
import { useAuth } from "@/auth/AuthContext";

export default function FretesPage() {
  const [rotas, setRotas] = useState<SolicitacaoFrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotaSelecionada, setRotaSelecionada] = useState<SolicitacaoFrete | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [rotaInicial, setRotaInicial] = useState("");
  const { user } = useAuth();

  const [usuarioLogado] = useState(user?.role || ""); // <- pegar de auth real

  const carregarRotas = () => {
    getRotas().then((data) => {
      setRotas(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    carregarRotas();
  }, []);

  if (loading) return <p className="p-6">Carregando itens...</p>;

  return (
    <DefaultLayout>

      <div className="p-6">
        {["ADMIN", "LOGISTICA"].includes(usuarioLogado) && (
          <>
            <h1 className="text-3xl font-semibold mb-3">Parâmetros de Frete</h1>
            <div className="flex justify-start items-center mb-6 gap-4">
              <CadCaminhoes />
              <CadParametros />
            </div>
            <CardCaminhoes />
            <Separator className="my-4 bg-gray-500" />
            <h1 className="text-3xl font-semibold mb-3">Fretes Solicitados:</h1>
            <RotasSolicitadasList />
            <Separator className="my-4 bg-gray-500" />

          </>
        )}
        <h1 className="text-3xl font-semibold">Cálculos De Fretes</h1>
        <div className="p-6">
          <SearchSelect
            data={rotas}
            onSelect={(item) => setRotaSelecionada(item)}
            placeholder="Selecione uma rota"
            onCreateFrete={(termo) => {
              setRotaInicial(termo);
              setOpenModal(true);
            }}
          />

          {rotaSelecionada && (
            <div className="p-4 rounded-md border bg-muted mt-4">
              <p><strong>ID:</strong> {rotaSelecionada.id}</p>
              <p><strong>Origem:</strong> {rotaSelecionada.origem}</p>
              <p><strong>Destino:</strong> {rotaSelecionada.destino}</p>
              <p><strong>Peso Calculado:</strong> </p>
            </div>
          )}
        </div>

        <SolicitarFreteModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          rotaInicial={rotaInicial}
          solicitante={usuarioLogado}
          onSucesso={() => carregarRotas()}
        />

        {rotaSelecionada && (
          <CalculoRotaVendedor
            rotaBaseId={rotaSelecionada.id}
          />
        )}
      </div>

    </DefaultLayout>
  );
}
