import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DialogConfirmProps {
  openDialogConfirm: boolean;
    setOpenDialogConfirm: (open: boolean) => void;
    confirmarFechamento: () => void;
}

export function DialogConfirm({
  openDialogConfirm,
  setOpenDialogConfirm, 
  confirmarFechamento,
}: DialogConfirmProps){
  return (
    <AlertDialog open={openDialogConfirm} onOpenChange={setOpenDialogConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deseja Fechar a Solicitação de Rota?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDialogConfirm(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarFechamento}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
}