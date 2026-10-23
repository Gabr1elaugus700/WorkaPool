const SIGLA = /^[A-Z]{1,2}$/;
const COR = /^#[0-9A-F]{6}$/;

export const ibcProdutoConfigForm = {
  siglaDe(value: string): string {
    return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  },
  corDe(value: string): string {
    const hex = value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
    return hex.length === 0 ? "" : `#${hex}`;
  },
  corDoSeletor(value: string): string {
    return COR.test(value) ? value : "#A3A3A3";
  },
  podeGravar(emUso: boolean, siglaObrigatoria: boolean, sigla: string, corHex: string): boolean {
    if (emUso || !COR.test(corHex)) return false;
    return siglaObrigatoria ? SIGLA.test(sigla) : true;
  },
};
