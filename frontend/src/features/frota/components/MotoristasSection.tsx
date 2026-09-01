import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { FleetMotorista } from "../types/fleet.types";

type Props = {
  motoristas: FleetMotorista[];
};

export function MotoristasSection({ motoristas }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Motoristas</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro completo de usuários com role MOTORISTA em Usuários.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/users">Gerenciar usuários</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {motoristas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Nenhum motorista cadastrado
              </TableCell>
            </TableRow>
          ) : (
            motoristas.map((motorista) => (
              <TableRow key={motorista.id}>
                <TableCell>{motorista.name}</TableCell>
                <TableCell>{motorista.role ?? "MOTORISTA"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
