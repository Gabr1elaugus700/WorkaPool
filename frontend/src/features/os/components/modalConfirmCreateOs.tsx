import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ModalConfirmCreateOs({
  open,
  onConfirm,
  onSkip,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  return (      
      <Dialog open={open} onOpenChange={onConfirm}
      >
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            Confirmar Abertura de OS
          </DialogTitle>
          <DialogDescription className="mt-2">
            Você deseja abrir uma Ordem de Serviço para os itens?
          </DialogDescription>
          <DialogFooter className="mt-4">
            <Button variant={"outline"} onClick={() => {onSkip(); onClose();}}>Não Abrir OS</Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
