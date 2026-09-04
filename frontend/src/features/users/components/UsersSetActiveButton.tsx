import { useState } from "react";
import { toast } from "sonner";
import { UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usersService } from "../services/usersService";

type Props = {
  userId: string;
  userLogin: string;
  isActive: boolean;
  onSuccess: () => void;
};

export function UsersSetActiveButton({ userId, userLogin, isActive, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const actionLabel = isActive ? "Inativar" : "Reativar";
  const submittingLabel = isActive ? "Inativando…" : "Reativando…";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (isActive) {
        await usersService.deactivate(userId);
        toast.success("Usuário inativado");
      } else {
        await usersService.reactivate(userId);
        toast.success("Usuário reativado");
      }
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Erro ao ${actionLabel.toLowerCase()} usuário. Tente novamente.`;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={submitting}
          aria-label={`${actionLabel} ${userLogin}`}
        >
          {isActive ? <UserX className="h-4 w-4" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
          {actionLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? "Inativar usuário?" : "Reativar usuário?"}</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            {isActive
              ? `${userLogin} não poderá entrar no WorkaPool enquanto estiver inativo.`
              : `${userLogin} voltará a poder entrar no WorkaPool.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={submitting} onClick={() => void handleConfirm()}>
            {submitting ? submittingLabel : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
