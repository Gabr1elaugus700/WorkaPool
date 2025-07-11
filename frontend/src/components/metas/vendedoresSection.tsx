// import clsx from 'clsx'
// import { useAuth } from '@/auth/AuthContext'
import React, { useState, useEffect } from "react";
import { fetchVendedores } from "@/services/useVendedores";
import { Vendedor } from "@/types/Vendedor";

type Props = {
    children: React.ReactNode
}

export default function VendedoresSection({ children }: Props) {

    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const [vendedoresData] = await Promise.all([
                    fetchVendedores(),
                ]);
                setVendedores(vendedoresData);
            } catch (error) {
                console.error("❌ Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, []);
    // const { user } = useAuth()

    return (
    
        <div>{loading ? "Carregando..." : children}
            <th>Vendedores:</th>
            <ul className="list-disc pl-6">
                {vendedores.map((vendedor) => (
                    <li key={vendedor.COD_REP}>
                        {vendedor.APE_REP} - (ID: {vendedor.COD_REP})
                    </li>
                ))}
            </ul>
        </div>



    )
}
