import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  search: string;
  includeInactive: boolean;
  onSearchSubmit: (search: string) => void;
  onIncludeInactiveChange: (includeInactive: boolean) => void;
};

export function UsersListFilters({
  search,
  includeInactive,
  onSearchSubmit,
  onIncludeInactiveChange,
}: Props) {
  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const nextSearch = String(formData.get("search") ?? "");
        onSearchSubmit(nextSearch);
      }}
    >
      <Input
        name="search"
        defaultValue={search}
        placeholder="Buscar por nome ou login"
        className="w-full max-w-xs"
        aria-label="Buscar usuários"
      />
      <Button type="submit" variant="outline" size="sm">
        Buscar
      </Button>
      <div className="flex items-center gap-2">
        <Checkbox
          id="include-inactive-users"
          checked={includeInactive}
          onCheckedChange={(checked) => onIncludeInactiveChange(checked === true)}
        />
        <Label htmlFor="include-inactive-users" className="cursor-pointer text-sm font-normal">
          Mostrar inativos
        </Label>
      </div>
    </form>
  );
}
