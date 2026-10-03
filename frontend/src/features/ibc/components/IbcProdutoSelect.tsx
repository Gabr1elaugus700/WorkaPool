import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IbcProdutoDTO } from "../types/ibcCadastro.types";

type Props = {
  id: string;
  produtos: IbcProdutoDTO[];
  value: string;
  disabled?: boolean;
  onChange: (produtoId: string) => void;
};

export default function IbcProdutoSelect({
  id,
  produtos,
  value,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        Produto
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Selecione um produto" />
        </SelectTrigger>
        <SelectContent>
          {produtos.map((produto) => (
            <SelectItem key={produto.id} value={produto.id}>
              {produto.nome} ({produto.abreviacao})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
