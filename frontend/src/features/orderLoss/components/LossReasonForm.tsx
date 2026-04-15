import { useState } from "react";
import { LossReasonCode, lossReasonLabels } from "../types/orderLoss.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface LossReasonFormProps {
  onSubmit: (code: LossReasonCode, description: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const LossReasonForm: React.FC<LossReasonFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [selectedCode, setSelectedCode] = useState<LossReasonCode | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    console.log('📝 [LossReasonForm] Iniciando validação...');
    console.log('📝 [LossReasonForm] selectedCode:', selectedCode);
    console.log('📝 [LossReasonForm] description:', description);
    
    // Validações
    if (!selectedCode) {
      console.warn('⚠️ [LossReasonForm] Erro: Nenhum código selecionado');
      setError("Selecione um motivo");
      return;
    }

    if (!description.trim()) {
      console.warn('⚠️ [LossReasonForm] Erro: Descrição vazia');
      setError("Escreva uma justificativa");
      return;
    }

    if (description.trim().length < 10) {
      console.warn('⚠️ [LossReasonForm] Erro: Descrição muito curta');
      setError("A justificativa deve ter pelo menos 10 caracteres");
      return;
    }

    // Submit
    console.log('✅ [LossReasonForm] Validação OK, enviando:', { selectedCode, description: description.trim() });
    onSubmit(selectedCode as LossReasonCode, description.trim());
  };

  return (
    <div className="space-y-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 mb-1">
            Motivo da Perda do Pedido
          </h4>
          <p className="text-sm text-red-700">
            Informe o motivo principal e descreva os detalhes da perda deste pedido.
          </p>
        </div>
      </div>

      {/* Seleção de Motivo */}
      <div className="space-y-2">
        <Label htmlFor="loss-reason-code" className="text-red-900">
          Código do Motivo *
        </Label>
        <Select
          value={selectedCode}
          onValueChange={(value) => {
            setSelectedCode(value as LossReasonCode);
            setError("");
          }}
        >
          <SelectTrigger id="loss-reason-code" className="bg-white">
            <SelectValue placeholder="Selecione o motivo principal" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(lossReasonLabels) as LossReasonCode[]).map((code) => (
              <SelectItem key={code} value={code}>
                {lossReasonLabels[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campo de Descrição */}
      <div className="space-y-2">
        <Label htmlFor="loss-description" className="text-red-900">
          Justificativa Detalhada *
        </Label>
        <textarea
          id="loss-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError("");
          }}
          placeholder="Descreva em detalhes o motivo da perda deste pedido..."
          className="w-full min-h-[100px] p-3 border border-red-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical"
          maxLength={500}
        />
        <p className="text-xs text-red-600">
          {description.length}/500 caracteres
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
          {error}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isSubmitting ? "Enviando..." : "Confirmar Perda"}
        </Button>
      </div>
    </div>
  );
};
