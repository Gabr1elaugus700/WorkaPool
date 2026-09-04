import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersService } from "../services/usersService";

type Props = {
  userId: string;
  userLogin: string;
  onSuccess: () => void;
};

export function UsersResetPasswordDialog({ userId, userLogin, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await usersService.resetPassword(userId, { password, mustChangePassword });
      toast.success("Senha redefinida");
      setPassword("");
      setMustChangePassword(true);
      setOpen(false);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao redefinir senha";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Redefinir senha de ${userLogin}`}>
          <KeyRound className="h-4 w-4" />
          Redefinir senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Defina uma senha temporária para {userLogin}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`reset-password-${userId}`}>Nova senha</Label>
              <Input
                id={`reset-password-${userId}`}
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`must-change-${userId}`}
                checked={mustChangePassword}
                onCheckedChange={(checked) => setMustChangePassword(checked === true)}
              />
              <Label htmlFor={`must-change-${userId}`} className="cursor-pointer text-sm font-normal">
                Exigir troca no próximo login
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Redefinir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
