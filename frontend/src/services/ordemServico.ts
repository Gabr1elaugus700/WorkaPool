export interface Cliente {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  }
  
  export interface Tecnico {
    id: number;
    nome: string;
    especialidade: string;
  }
  
  export type StatusOrdem = 'aberta' | 'em andamento' | 'finalizada';
  
  export interface OrdemServico {
    id: number;
    clienteId: number;
    tecnicoId: number;
    descricao: string;
    status: StatusOrdem;
    dataCriacao: string;
    dataFinalizacao?: string;
  }
  
  export const clientesMock: Cliente[] = [
    { id: 1, nome: 'Carlos Silva', email: 'carlos@email.com', telefone: '11999999999' },
    { id: 2, nome: 'Ana Souza', email: 'ana@email.com', telefone: '11988888888' },
  ];
  
  export const tecnicosMock: Tecnico[] = [
    { id: 1, nome: 'João Técnico', especialidade: 'Elétrica' },
    { id: 2, nome: 'Maria Manutenção', especialidade: 'Informática' },
  ];
  
  export const ordensMock: OrdemServico[] = [
    {
      id: 1001,
      clienteId: 1,
      tecnicoId: 2,
      descricao: 'Conserto de computador com problema no HD',
      status: 'em andamento',
      dataCriacao: '2025-04-01T10:00:00Z',
    },
    {
      id: 1002,
      clienteId: 2,
      tecnicoId: 1,
      descricao: 'Troca de fiação elétrica na sala',
      status: 'finalizada',
      dataCriacao: '2025-03-28T14:30:00Z',
      dataFinalizacao: '2025-03-30T16:45:00Z',
    },
    {
      id: 1003,
      clienteId: 1,
      tecnicoId: 1,
      descricao: 'Instalação de tomada industrial',
      status: 'aberta',
      dataCriacao: '2025-04-06T09:15:00Z',
    },
  ];
  