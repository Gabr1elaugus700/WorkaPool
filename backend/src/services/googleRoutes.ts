import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

interface RotaResultado {
    distanciaKm: number;
    duracaoHoras: number;
    pedagio: number;
    custoDiesel: number;
    custoTotal: number;
}

interface Coordenadas {
    latitude: number;
    longitude: number;
}

async function geocodificarEndereco(endereco: string): Promise<Coordenadas> {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: endereco,
            key: GOOGLE_API_KEY
        }
    });

    const resultado = response.data.results[0];

    if (!resultado) throw new Error(`Endereço não encontrado: ${endereco}`);

    const { lat, lng } = resultado.geometry.location;
    return { latitude: lat, longitude: lng };
}

export async function calcularCustoViagem(
    origem: string,
    destino: string,
    consumoKmPorLitro: number,
    precoDiesel: number
): Promise<RotaResultado> {
    const origemCoordenadas = await geocodificarEndereco(origem);
    const destinoCoordenadas = await geocodificarEndereco(destino);

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo'

    };

    const body = {
        origin: {
            location: {
                latLng: {
                    latitude: origemCoordenadas.latitude,
                    longitude: origemCoordenadas.longitude
                }
            }
        },
        destination: {
            location: {
                latLng: {
                    latitude: destinoCoordenadas.latitude,
                    longitude: destinoCoordenadas.longitude
                }
            }
        },

        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        languageCode: 'pt-BR',
        units: 'METRIC',
        extraComputations: ["TOLLS"]
    };

    const response = await axios.post(url, body, { headers });

    const route = response.data.routes[0];
    console.dir(route.travelAdvisory, { depth: null });

    const distanciaKm = route.distanceMeters / 1000;

    const duracaoISO = route.duration; // exemplo: "3600s"
    const duracaoSegundos = parseInt(duracaoISO.replace('s', ''));
    const duracaoHoras = duracaoSegundos / 3600;

    const est = route.travelAdvisory?.tollInfo?.estimatedPrice?.[0];
    const pedagio = est
        ? parseFloat(est.units) + (est.nanos ?? 0) / 1e9
        : 0;

    const custoDiesel = (distanciaKm / consumoKmPorLitro) * precoDiesel;
    const custoTotal = custoDiesel + pedagio;


    return {
        distanciaKm,
        duracaoHoras,
        pedagio,
        custoDiesel,
        custoTotal
    };
}

// Exemplo de uso para teste
(async () => {
    try {
        const resultado = await calcularCustoViagem(
            'São Paulo, SP',
            'Rio de Janeiro, RJ',
            8,
            6.50
        );
        
        console.log(`Distância: ${resultado.distanciaKm.toFixed(2)} km`);
        console.log(`Duração: ${resultado.duracaoHoras.toFixed(1)} horas`);
        console.log(`Pedágios: R$ ${resultado.pedagio.toFixed(2)}`);
        console.log(`Custo com diesel: R$ ${resultado.custoDiesel.toFixed(2)}`);
        console.log(`Custo total: R$ ${resultado.custoTotal.toFixed(2)}`);

    } catch (err) {
        console.error('Erro ao calcular rota:', err);
    }
})();
