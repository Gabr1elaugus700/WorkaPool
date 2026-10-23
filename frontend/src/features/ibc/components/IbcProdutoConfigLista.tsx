import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IbcProdutoGrupoConfig, ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";

export type IbcProdutoConfigAlvo = { tipo: "universal" } | { tipo: "grupo"; grupo: IbcProdutoGrupoConfig };

type Props = { lista: ListaIbcProdutoConfig; canWrite: boolean; onEditar: (alvo: IbcProdutoConfigAlvo) => void };

function Amostra({ corHex }: { corHex: string | null }) {
  if (!corHex) return <span className="font-medium text-foreground">Pendente</span>;
  return <span className="inline-block h-7 w-10 rounded-md border border-border shadow-sm" style={{ backgroundColor: corHex }} role="img" aria-label={`Amostra ${corHex}`} />;
}

export default function IbcProdutoConfigLista({ lista, canWrite, onEditar }: Props) {
  const editar = (label: string, alvo: IbcProdutoConfigAlvo) => canWrite ? (
    <TableCell className="px-3 py-2 text-right">
      <Button type="button" variant="ghost" size="sm" aria-label={label} onClick={() => onEditar(alvo)}>Editar</Button>
    </TableCell>
  ) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {["Grupo", "Sigla", "Cor", "Em uso", "Aviso"].map((label) => (
              <TableHead key={label} className="h-9 px-3 text-xs font-medium">{label}</TableHead>
            ))}
            {canWrite ? <TableHead className="h-9 px-3"><span className="sr-only">Ações</span></TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-3 py-2">
              <span className="block font-medium text-foreground">Universal</span>
              <span className="text-xs text-muted-foreground">Lavado entre usos</span>
            </TableCell>
            <TableCell className="px-3 py-2 text-muted-foreground">—</TableCell>
            <TableCell className="px-3 py-2"><Amostra corHex={lista.universal.configurado ? lista.universal.corHex : null} /></TableCell>
            <TableCell className="px-3 py-2">{lista.universal.emUso ? "Em uso" : "—"}</TableCell>
            <TableCell className="px-3 py-2 text-muted-foreground">—</TableCell>
            {editar("Editar Universal", { tipo: "universal" })}
          </TableRow>
          {lista.grupos.map((grupo) => {
            const nome = grupo.grupoDescricao?.trim() || grupo.grupoCodigo;
            return (
              <TableRow key={grupo.grupoCodigo}>
                <TableCell className="px-3 py-2">
                  <span className="block font-medium text-foreground">{nome}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{grupo.grupoCodigo}</span>
                </TableCell>
                <TableCell className={`px-3 py-2 tabular-nums ${grupo.sigla ? "" : "font-medium text-foreground"}`}>{grupo.sigla ?? "Pendente"}</TableCell>
                <TableCell className="px-3 py-2"><Amostra corHex={grupo.corHex} /></TableCell>
                <TableCell className="px-3 py-2">{grupo.emUso ? "Em uso" : "—"}</TableCell>
                <TableCell className="px-3 py-2">
                  {grupo.encontradoNoSapiens ? <span className="text-muted-foreground">—</span> : <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Não encontrado no Sapiens</span>}
                </TableCell>
                {editar(`Editar ${nome}`, { tipo: "grupo", grupo })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {lista.grupos.length === 0 ? <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground">Nenhum grupo veio do catálogo do Sapiens.</p> : null}
    </div>
  );
}
