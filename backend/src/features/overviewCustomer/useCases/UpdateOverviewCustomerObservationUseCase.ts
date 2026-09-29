import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerObservationAuthorLookup } from "../repositories/OverviewCustomerObservationAuthorRepository";
import type { OverviewCustomerObservationRepository } from "../repositories/OverviewCustomerObservationRepository";
import { OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH } from "../schemas/overviewCustomerObservation.schemas";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import {
  assertOverviewCustomerAccess,
  type AssertOverviewCustomerAccessInput,
} from "../utils/assertOverviewCustomerAccess";
import { mapOverviewCustomerObservationItem } from "../utils/mapOverviewCustomerObservationItem";
import type { OverviewCustomerObservationListItem } from "./ListOverviewCustomerObservationsUseCase";

export type UpdateOverviewCustomerObservationInput =
  AssertOverviewCustomerAccessInput & {
    observationId: string;
    requesterUserId: string;
    body: string;
  };

export type UpdateOverviewCustomerObservationResult =
  OverviewCustomerObservationListItem;

export class UpdateOverviewCustomerObservationUseCase {
  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly observations: OverviewCustomerObservationRepository,
    private readonly authors: OverviewCustomerObservationAuthorLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: UpdateOverviewCustomerObservationInput,
  ): Promise<UpdateOverviewCustomerObservationResult> {
    await assertOverviewCustomerAccess(this.store, {
      customerCode: input.customerCode,
      role: input.role,
      codRep: input.codRep,
    });

    const existing = await this.observations.findByIdForCustomer(
      input.observationId,
      input.customerCode,
    );
    if (!existing) {
      throw new AppError({
        message: "Observação não encontrada",
        statusCode: 404,
        code: "OBSERVATION_NOT_FOUND",
      });
    }

    if (existing.authorUserId !== input.requesterUserId) {
      throw new AppError({
        message: "Somente o autor pode editar a observação",
        statusCode: 403,
        code: "OBSERVATION_EDIT_FORBIDDEN",
      });
    }

    const trimmed = input.body.trim();
    if (trimmed.length === 0 || trimmed.length > OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH) {
      throw new AppError({
        message: "Corpo da observação inválido",
        statusCode: 400,
        code: "OBSERVATION_INVALID_BODY",
      });
    }

    const record = await this.observations.updateBody({
      id: existing.id,
      body: trimmed,
      editedAt: this.now(),
    });

    const authorMatches = await this.authors.findDisplayNamesByIds([
      record.authorUserId,
    ]);
    const authorDisplayName =
      authorMatches.find((match) => match.id === record.authorUserId)
        ?.displayName ?? "";

    return mapOverviewCustomerObservationItem(record, authorDisplayName);
  }
}
