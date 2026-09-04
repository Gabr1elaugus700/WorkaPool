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

const PASSWORD_MIN_LENGTH = 6;

export function UsersResetPasswordDialog({ userId, userLogin, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setPassword("");
    setMustChangePassword(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) {
      return;
    }
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleCancel = () => {
    if (submitting) {
      return;
    }
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await usersService.resetPassword(userId, { password, mustChangePassword });
      toast.success("Senha redefinida");
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao redefinir senha. Tente novamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordHintId = `reset-password-hint-${userId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Redefinir senha de ${userLogin}`}>
          <KeyRound className="h-4 w-4" aria-hidden />
          Redefinir senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription className="break-words">
              Defina uma senha temporária para {userLogin}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`reset-password-${userId}`}>Nova senha</Label>
              <Input
                id={`reset-password-${userId}`}
                type="password"
                minLength={PASSWORD_MIN_LENGTH}
                required
                autoComplete="new-password"
                disabled={submitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={passwordHintId}
              />
              <p id={passwordHintId} className="text-xs text-muted-foreground">
                Mínimo de {PASSWORD_MIN_LENGTH} caracteres.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`must-change-${userId}`}
                checked={mustChangePassword}
                disabled={submitting}
                onCheckedChange={(checked) => setMustChangePassword(checked === true)}
              />
              <Label htmlFor={`must-change-${userId}`} className="cursor-pointer text-sm font-normal">
                Exigir troca no próximo login
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Redefinindo…" : "Redefinir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
