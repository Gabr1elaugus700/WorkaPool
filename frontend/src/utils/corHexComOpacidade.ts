const HEX_RGB = /^#[0-9A-Fa-f]{6}$/;

export function corHexComOpacidade(corHex: string, opacidade: number): string {
  if (!HEX_RGB.test(corHex)) return corHex;
  const limitada = Math.min(1, Math.max(0, opacidade));
  const alfa = Math.round(limitada * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${corHex.toUpperCase()}${alfa}`;
}
