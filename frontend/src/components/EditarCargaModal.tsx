import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { Pencil } from 'lucide-react';
// import { useAuth } from "../auth/AuthContext";
import { Carga as Cargas } from '@/types/cargas'
// import { useNavigate } from 'react-router-dom';


const API = import.meta.env.VITE_API_URL;



type Props = {
    carga: Cargas;
    onUpdated: (nova: Cargas) => void;
};

export function EditarCargaModal({ carga, onUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        ...carga,
        previsaoSaida: new Date(carga.previsaoSaida).toISOString().slice(0, 10)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'pesoMax' || name === 'custoMin' ? Number(value) : value,
        }));
    };

    const handleSituacaoChange = (value: string) => {
        setForm(prev => ({ ...prev, situacao: value }));
    };

    const atualizarCarga = async () => {
        const res = await fetch(`${API}/api/Cargas/${carga.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const atualizada = await res.json();
        setOpen(false);
        onUpdated({
            ...atualizada,
            pedidos: carga.pedidos ?? [], // evita undefined
            pesoAtual: carga.pesoAtual ?? 0, // evita undefined
        });
    };



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className='bg-emerald-600 text-white rounded hover:bg-emerald-700 w-12 h-12 mr-2'><Pencil className="!w-5 !h-5" /></Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Carga</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <Label>Destino</Label>
                        <Input name="destino" value={form.destino} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Previsão de Saída</Label>
                        <Input name="previsaoSaida" type="date" value={form.previsaoSaida} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Peso Máximo (kg)</Label>
                        <Input name="pesoMax" type="number" value={form.pesoMax} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Custo Mínimo (R$)</Label>
                        <Input name="custoMin" type="number" value={form.custoMin} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Situação</Label>
                        <Select value={form.situacao} onValueChange={handleSituacaoChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ABERTA">ABERTA</SelectItem>
                                <SelectItem value="FECHADA">FECHADA</SelectItem>
                                <SelectItem value="SOLICITADA">SOLICITADA</SelectItem>
                                <SelectItem value="CANCELADA">CANCELADA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={atualizarCarga} className="w-full bg-blue-600 text-white hover:bg-blue-700">Salvar alterações</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
