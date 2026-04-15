import { useState, useEffect } from "react";
import { vistoriasService } from "../services/inspection.service";
import { ChecklistModelo } from "../models/checklist.model";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type CheckboxSurveyProps = {
  selectedChecklistId: string;
  onChangeItens: (
    itens: { checklistItemId: string; checked: boolean; observacao: string }[]
  ) => void;
};

export default function SelectedChecklist({
  selectedChecklistId,
  onChangeItens,
}: CheckboxSurveyProps) {
  const [checklist, setChecklist] = useState<ChecklistModelo[]>([]);

  // Agora o estado guarda checklistItemId (id do item real)
  const [itens, setItens] = useState<
    { checklistItemId: string; checked: boolean; observacao: string }[]
  >([]);

  const checkItemNotChecked = itens.some((item) => !item.checked);
  console.log("checkItemNotChecked:", checkItemNotChecked);

  useEffect(() => {
    // Busca o checklist selecionado(id)
    const fetchChecklists = async () => {
      const response = await vistoriasService.getChecklistByModeloId(
        selectedChecklistId
      );
      const data = response;
      setChecklist([
        {
          id: data.id,
          nome: data.nome,
          descricao: data.descricao,
          itens: data.itens,
          departamento_id: data.departamento_id,
          departamento: data.departamento,
        },
      ]);
    };
    fetchChecklists();
  }, [selectedChecklistId]);

  useEffect(() => {
    // Quando checklist mudar, reseta os itens
    setItens(
      checklist[0]?.itens.map((item) => ({
        checklistItemId: item.checklistItem?.id || item.checklistItemId, // pega o id do item real
        checked: false,
        observacao: "",
      })) || []
    );
  }, [checklist]);

  
  useEffect(() => {
    // Notifica o componente pai sobre a mudança nos itens
    onChangeItens(itens);
  }, [itens, onChangeItens]);


  const handleCheck = (checklistItemId: string, checked: boolean) => {
    setItens((prev) =>
      prev.map((item) =>
        item.checklistItemId === checklistItemId ? { ...item, checked } : item
      )
    );
  };

  const handleObs = (checklistItemId: string, observacao: string) => {
    setItens((prev) =>
      prev.map((item) =>
        item.checklistItemId === checklistItemId
          ? { ...item, observacao }
          : item
      )
    );
  };


  return (
    <div>
      <div className="flex flex-col gap-6">
        {checklist.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum checklist selecionado.</p>
        )}
        {checklist.map((checklist) => (
          <div key={checklist.id} className="border rounded-lg p-4">
            <div className="flex flex-col gap-2 mb-4 justify-center items-center">
              <h3 className="font-semibold justify-center text-lg">
                Checklist Selecionado: {checklist.nome}
              </h3>

              {checklist.descricao && (
                <p className="text-sm text-gray-500">
                  {" "}
                  Descrição: {checklist.descricao}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2 ">
              {checklist.itens.map((item) => (
                
                
                <div
                  key={item.id}
                  className="flex gap-2 flex-col g-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={
                        itens.find(
                          (i) =>
                            i.checklistItemId ===
                            (item.checklistItem?.id || item.checklistItemId)
                        )?.checked || false
                      }
                      onCheckedChange={(checked) =>
                        handleCheck(
                          item.checklistItem?.id || item.checklistItemId,
                          !!checked
                        )
                      }
                      className="h-6 w-6"
                    />
                    <Label htmlFor={`item-${item.id}`}>
                      {item.checklistItem.descricao}
                    </Label>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Observação"
                      className="ml-4 flex-1 border rounded px-2 py-1 text-sm"
                      value={
                        itens.find(
                          (i) =>
                            i.checklistItemId ===
                            (item.checklistItem?.id || item.checklistItemId)
                        )?.observacao || ""
                      }
                      onChange={(e) =>
                        handleObs(
                          item.checklistItem?.id || item.checklistItemId,
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
