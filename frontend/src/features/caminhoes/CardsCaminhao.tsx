import { getCaminhoes } from '@/shared/api/useCarminhoesService';
import { useEffect, useState } from 'react';
import { Caminhao } from '@/types/caminhoes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Truck } from 'lucide-react';


export default function CardsCaminhao() {
    const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);

    async function carregarCaminhoes() {
        try {
            const data = await getCaminhoes();
            console.log("Parâmetros de frete obtidos com sucesso:", data);
            setCaminhoes(data);
        } catch (error) {
            console.error("Erro ao obter parâmetros de frete:", error);
        }
    }

    useEffect(() => {
        carregarCaminhoes();
    }, []);

    return (
        <div>
            <h2>Caminhões Disponiveis:</h2>

            
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-5 gap-3">
                {caminhoes.map(caminhao => (
                    <Card key={caminhao.id} className="bg-muted  mb-4 mt-2 border-2 border-gray-300 shadow-sm b-2 rounded-lg hover:shadow-md transition-shadow duration-200">
                        <CardHeader className='flex items-center gap-2'>
                            <Truck className='w-7 h-7 ml-2'/>
                            <CardTitle className='text-lg'>{caminhao.modelo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                <p>Eixos: {caminhao.eixos}</p>
                                <p>Capacidade: {caminhao.capacidade_kg} kg</p>
                                <p>Consumo: {caminhao.consumo_medio_km_l} km/l</p>
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>  
        </div>
    );
}
