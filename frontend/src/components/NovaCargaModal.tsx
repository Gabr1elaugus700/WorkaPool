import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
const API = import.meta.env.VITE_API_URL;
import { useAuth } from "../auth/AuthContext";
import { PackagePlus } from 'lucide-react';

type Cargas = {
    id: string;
    codCar: number;
    name: string;
    destino: string;
    pesoMax: number;
    custoMin: number;
    previsaoSaida: Date;
    situacao: string;
    createdAt: string;
};


type Props = {
    onCreated: (novaCarga: Cargas) => void;
};

export function NovaCargaModal({ onCreated }: Props) {
    const { user } = useAuth();

    const situacao = user?.role === 'ADMIN' || user?.role === 'lOGISTICA' ? 'ABERTA' : 'SOLICITADA';
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        destino: '',
        pesoMax: 10000,
        custoMin: 1,
        situacao: situacao,
        previsaoSaida: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue: string | number = value;

    if (name === 'pesoMax' || name === 'custoMin') {
        newValue = Number(value);
    }

    setForm({ ...form, [name]: newValue });
};


    const criarCarga = async () => {
        const res = await fetch(`${API}/api/Cargas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const nova = await res.json();
        onCreated(nova);
        setForm({
            name: '',
        destino: '',
        pesoMax: 10000,
        custoMin: 0,
        situacao: situacao,
        previsaoSaida: ''
        })
        setOpen(false);
        console.log(nova)
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild >
                <Button className=" bg-emerald-600 text-white rounded hover:bg-emerald-700"> <PackagePlus className='!w-6 !h-6'/> </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar nova carga</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* <div>
                        <Label>Nome</Label>
                        <Input name="name" value={form.name} onChange={handleChange} />
                    </div> */}
                    <div>
                        <Label>Destino</Label>
                        <Input name="destino" value={form.destino} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Previsão Saída da Carga</Label>
                        <Input name="previsaoSaida" type='date' value={form.previsaoSaida} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Peso Máximo (kg)</Label>
                        <Input name="pesoMax" type="number" value={form.pesoMax} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Custo Mínimo (R$)</Label>
                        <Input name="custoMin" type="number" value={form.custoMin} onChange={handleChange} />
                    </div>
                    <Button onClick={criarCarga} className="w-full mt-2  bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">
                        Criar Carga
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
