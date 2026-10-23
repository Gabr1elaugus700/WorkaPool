export type IbcMotivoInaptidao =
  | "AGUARDANDO_INSPECAO"
  | "DATA_LIMITE"
  | "INSPECAO_REPROVADA";

export type IbcCadastroDTO = {
  id: string;
  identificador: string;
  tipoCadastro: "NOVO" | "TROCA";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  custodia: "PATIO" | "EM_VIAGEM" | "ENTRADA" | "CLIENTE";
  dataLimite: string | null;
  primeiraInspecaoEm: string | null;
  baixadoEm: string | null;
  createdAt: string;
  loteId?: string | null;
  produtoId?: string | null;
  prefixo?: string | null;
  sequencial?: number | null;
  convertedToContainerId?: string | null;
  corHex?: string | null;
  universal?: boolean;
  homologado?: boolean;
};

export type IbcMudancaTipo = "conversion" | "product_change" | "status_change";

export type IbcHistoricoDTO = {
  id: string;
  changeType: IbcMudancaTipo;
  observation: string | null;
  actorId: string;
  actorName: string | null;
  createdAt: string;
  from: { id: string; identificador: string };
  to: { id: string; identificador: string };
  identificadorAnterior: string | null;
  corAnterior: string | null;
  identificadorNovo: string | null;
  corNova: string | null;
};

export type IbcConversaoDestino = "manter_grupo" | "universal";

export type IbcMudancaConfirmacaoInput = {
  confirmado: true;
  observacao: string | null;
};

export type ConvertIbcInput = IbcMudancaConfirmacaoInput & {
  destino: IbcConversaoDestino;
  grupoCodigo?: string | null;
};

export type ChangeIbcProdutoInput = IbcMudancaConfirmacaoInput & {
  produtoId: string;
};

export type IbcItemAbaixoDoMinimoDTO = {
  descricao: string;
  nota: number;
  notaMinima: number;
};

export type IbcAlocacaoAbertaDTO = { codCar: number; numPed: string };

export type IbcAlertDetalhesDTO = {
  checklists: Array<{
    checklistModeloId: string;
    nome: string;
    mediaObtida: number | null;
    mediaMinima: number;
    itensAbaixoDoMinimo: IbcItemAbaixoDoMinimoDTO[];
  }>;
  alocacao?: IbcAlocacaoAbertaDTO;
};

export type IbcAlertDTO = {
  identificador: string;
  motivo: IbcMotivoInaptidao | "SEM_INSPECAO";
  detalhes?: IbcAlertDetalhesDTO;
};

export type CreateNovoIbcInput = {
  dataLimite: string;
  homologado: boolean;
  grupoCodigo?: string | null;
};

export type CreateLoteIbcInput = {
  quantidade: number;
  dataLimite: string;
  numeroNf?: string | null;
  homologado: boolean;
  grupoCodigo?: string | null;
};

export type IbcLoteDTO = {
  id: string;
  numeroNf: string | null;
  dataLimite: string;
  createdAt: string;
};

export type LoteSaldoWarningDTO =
  | {
      code: "OVER_SALDO";
      vivos: number;
      quantidade: number;
      saldo: number;
    }
  | {
      code: "SALDO_UNAVAILABLE";
      vivos: number;
      quantidade: number;
    };

export type CreateLoteIbcResultDTO = {
  items: IbcCadastroDTO[];
  lote: IbcLoteDTO;
  warning?: LoteSaldoWarningDTO;
};

export type IbcProdutoDTO = {
  id: string;
  nome: string;
  abreviacao: string;
  createdAt: string;
  updatedAt: string;
};

export type IbcProdutoListItemDTO = IbcProdutoDTO & {
  possuiIbcs: boolean;
};
