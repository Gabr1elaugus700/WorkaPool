import { clientesMock, tecnicosMock, ordensMock } from '../services/ordemServico';

export const OrdensPage = () => {
    const getClienteNome = (id: number) => clientesMock.find(c => c.id === id)?.nome || 'Desconhecido';
    const getTecnicoNome = (id: number) => tecnicosMock.find(t => t.id === id)?.nome || 'Desconhecido';

    return (
        <div>
            <h1>Ordens de Serviço</h1>
            <ul>
                {ordensMock.map(ordem => (
                    <li key={ordem.id}>
                        <strong>#{ordem.id}</strong> - {ordem.descricao} <br />
                        Cliente: {getClienteNome(ordem.clienteId)} | Técnico: {getTecnicoNome(ordem.tecnicoId)} <br />
                        Status: {ordem.status.toUpperCase()} | Criada em: {new Date(ordem.dataCriacao).toLocaleDateString()}
                        {ordem.dataFinalizacao && <> | Finalizada em: {new Date(ordem.dataFinalizacao).toLocaleDateString()}</>}
                    </li>
                ))}
            </ul>
        </div>
    );
};
