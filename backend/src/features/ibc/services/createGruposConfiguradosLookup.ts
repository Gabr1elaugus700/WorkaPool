import type { GruposConfiguradosLookup } from "./carregarCompatibilidadeDePedidos";

export function createGruposConfiguradosLookup(): GruposConfiguradosLookup {
  // Lazy-load para não abrir o Prisma nos testes que não consultam configuração.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { IbcProdutoRepository } = require("../repositories/IbcProdutoRepository") as {
    IbcProdutoRepository: new () => GruposConfiguradosLookup;
  };
  return new IbcProdutoRepository();
}
