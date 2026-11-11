import { isHomologadoPrefixo, resolveIbcPrefixo } from "../services/getIbcIdentifierPrefix";
import { IbcPlacaPaleta } from "../types/IbcExpedicao.types";

export type ContainerPaletaDto = {
  identificador: string;
  alocacaoId: string | null;
  grupoCodigo: string | null;
  corHex: string | null;
  universal: boolean;
  homologado: boolean;
};

export function mapContainerPaleta(
  ibc: IbcPlacaPaleta,
  alocacaoId: string | null,
): ContainerPaletaDto {
  const prefixo = resolveIbcPrefixo(ibc);
  return {
    identificador: ibc.identificador,
    alocacaoId,
    grupoCodigo: ibc.grupoCodigo,
    corHex: ibc.corHex,
    universal: ibc.universal,
    homologado: prefixo != null && isHomologadoPrefixo(prefixo),
  };
}
