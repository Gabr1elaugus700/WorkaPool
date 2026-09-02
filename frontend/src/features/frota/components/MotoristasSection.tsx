import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MotoristaDespacho } from "@/features/cargo/types/cargo.types";

type Props = {
  motoristas: MotoristaDespacho[];
};

export function MotoristasSection({ motoristas }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {motoristas.length === 0 ? (
          <TableRow>
            <TableCell>
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground/60" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nenhum motorista cadastrado</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre usuários com role MOTORISTA em{" "}
                    <Link to="/users" className="text-primary underline-offset-4 hover:underline">
                      Usuários
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          motoristas.map((motorista) => (
            <TableRow key={motorista.id}>
              <TableCell>{motorista.name}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
