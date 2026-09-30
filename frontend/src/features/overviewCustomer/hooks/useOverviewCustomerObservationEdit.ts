import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { OverviewCustomerService } from "../services/overviewCustomerService";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationEditControls,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";
import {
  canSaveObservationEdit,
  replaceObservation,
  resolveObservationEditError,
} from "../utils/overviewCustomerObservationsState.utils";

type SaveEditInput = { observationId: string; body: string };

export function useOverviewCustomerObservationEdit(
  customerCode: number,
  { open, queryKey }: { open: boolean; queryKey: QueryKey },
): OverviewCustomerObservationEditControls {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OverviewCustomerObservation | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const { mutate, isPending } = useMutation<OverviewCustomerObservation, Error, SaveEditInput>({
    mutationFn: ({ observationId, body }) =>
      OverviewCustomerService.updateObservation(customerCode, observationId, body),
  });

  const onCancel = useCallback(() => {
    setEditing(null);
    setDraft("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      onCancel();
    }
  }, [open, onCancel]);

  const onStart = useCallback((observation: OverviewCustomerObservation) => {
    setEditing(observation);
    setDraft(observation.body);
    setError(null);
  }, []);

  const onDraftChange = useCallback((value: string) => {
    setDraft(value);
    setError(null);
  }, []);

  const canSave = editing !== null && canSaveObservationEdit(draft, editing.body, isPending);

  const onSave = useCallback(() => {
    if (inFlightRef.current || editing === null || !canSave) {
      return;
    }

    inFlightRef.current = true;
    setError(null);

    mutate({ observationId: editing.id, body: draft.trim() }, {
      onSuccess: (item) => {
        queryClient.setQueryData<OverviewCustomerObservationListResponse>(
          queryKey,
          (page) => replaceObservation(page, item),
        );
        onCancel();
      },
      onError: (mutationError: unknown) => {
        const message = resolveObservationEditError(mutationError);
        setError(message);
        toast.error(message);
      },
      onSettled: () => {
        inFlightRef.current = false;
      },
    });
  }, [canSave, draft, editing, mutate, onCancel, queryClient, queryKey]);

  const editingId = editing?.id ?? null;
  return useMemo(
    () => ({ editingId, draft, error, isSaving: isPending, canSave, onStart, onDraftChange, onCancel, onSave }),
    [canSave, draft, editingId, error, isPending, onCancel, onDraftChange, onSave, onStart],
  );
}
