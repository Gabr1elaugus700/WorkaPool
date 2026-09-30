import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OverviewCustomerService } from "../services/overviewCustomerService";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationCursor,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";
import {
  appendObservation,
  canSubmitObservation,
  draftAfterObservationSubmitError,
  draftAfterObservationSubmitSuccess,
  isObservationListLoading,
  prependOlderObservations,
  resolveObservationSubmitError,
} from "../utils/overviewCustomerObservationsState.utils";
import { useOverviewCustomerObservationEdit } from "./useOverviewCustomerObservationEdit";

const EMPTY_OBSERVATIONS: OverviewCustomerObservation[] = [];
const LOAD_OLDER_ERROR = "Não foi possível carregar observações anteriores";

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
  const hasOlder = page?.hasOlder ?? false;
  const nextBefore = page?.nextBefore ?? null;

  const loadOlderInFlightRef = useRef(false);
  const { mutate: mutateLoadOlder, isPending: isLoadingOlder } = useMutation<
    OverviewCustomerObservationListResponse,
    Error,
    OverviewCustomerObservationCursor
  >({
    mutationFn: (before) => OverviewCustomerService.getObservations(customerCode, before),
  });

  const loadOlder = useCallback(() => {
    if (loadOlderInFlightRef.current || !hasOlder || nextBefore === null) {
      return;
    }

    loadOlderInFlightRef.current = true;
    mutateLoadOlder(nextBefore, {
      onSuccess: (olderPage) => {
        queryClient.setQueryData<OverviewCustomerObservationListResponse>(
          queryKey,
          // The modal may have closed (cache removed) while the request was in flight.
          (current) => (current ? prependOlderObservations(current, olderPage) : current),
        );
      },
      onError: () => {
        toast.error(LOAD_OLDER_ERROR);
      },
      onSettled: () => {
        loadOlderInFlightRef.current = false;
      },
    });
  }, [hasOlder, mutateLoadOlder, nextBefore, queryClient, queryKey]);

  return {
    items: page?.items ?? EMPTY_OBSERVATIONS,
    hasOlder,
    nextBefore,
    loadOlder,
    isLoadingOlder,
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
