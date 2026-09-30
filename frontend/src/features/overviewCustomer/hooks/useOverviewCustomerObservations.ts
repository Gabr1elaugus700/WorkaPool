import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OverviewCustomerService } from "../services/overviewCustomerService";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";
import {
  appendObservation,
  canSubmitObservation,
  draftAfterObservationSubmitError,
  draftAfterObservationSubmitSuccess,
  isObservationListLoading,
  resolveObservationSubmitError,
} from "../utils/overviewCustomerObservationsState.utils";
import { useOverviewCustomerObservationEdit } from "./useOverviewCustomerObservationEdit";

const EMPTY_OBSERVATIONS: OverviewCustomerObservation[] = [];

function overviewCustomerObservationsQueryKey(customerCode: number) {
  return ["overview-customer-observations", customerCode] as const;
}

export function useOverviewCustomerObservations(
  customerCode: number,
  { open }: { open: boolean },
) {
  const queryClient = useQueryClient();
  const [draft, setDraftState] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const queryKey = useMemo(
    () => overviewCustomerObservationsQueryKey(customerCode),
    [customerCode],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => OverviewCustomerService.getObservations(customerCode),
    enabled: open,
    gcTime: 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (open) {
      return;
    }
    // gcTime only drops the cache after the last observer leaves. This hook
    // stays mounted to read `open`, so drop the page on close and the next
    // open cannot paint the previous thread before the fresh GET.
    queryClient.removeQueries({ queryKey, exact: true });
  }, [open, queryClient, queryKey]);

  const { mutate, isPending } = useMutation<
    OverviewCustomerObservation,
    Error,
    string
  >({
    mutationFn: (body) =>
      OverviewCustomerService.createObservation(customerCode, body),
  });

  const setDraft = useCallback((value: string) => {
    setDraftState(value);
    setSubmitError(null);
  }, []);

  const submit = useCallback(() => {
    if (inFlightRef.current || !canSubmitObservation(draft, isPending)) {
      return;
    }

    const body = draft.trim();
    inFlightRef.current = true;
    setSubmitError(null);

    mutate(body, {
      onSuccess: (item) => {
        queryClient.setQueryData<OverviewCustomerObservationListResponse>(
          queryKey,
          (page) => appendObservation(page, item),
        );
        setDraftState(draftAfterObservationSubmitSuccess());
      },
      onError: (error: unknown) => {
        setDraftState((current) => draftAfterObservationSubmitError(current));
        const message = resolveObservationSubmitError(error);
        setSubmitError(message);
        toast.error(message);
      },
      onSettled: () => {
        inFlightRef.current = false;
      },
    });
  }, [draft, isPending, mutate, queryClient, queryKey]);

  const edit = useOverviewCustomerObservationEdit(customerCode, { open, queryKey });

  const page = open ? query.data : undefined;
  const isError = open && query.isError;

  return {
    items: page?.items ?? EMPTY_OBSERVATIONS,
    hasOlder: page?.hasOlder ?? false,
    nextBefore: page?.nextBefore ?? null,
    isLoading: isObservationListLoading({
      open,
      hasData: page !== undefined,
      isError,
      isQueryLoading: query.isLoading,
    }),
    isError,
    refetch: query.refetch,
    draft,
    setDraft,
    submit,
    isSubmitting: isPending,
    submitError,
    canSubmit: canSubmitObservation(draft, isPending),
    edit,
  };
}
