import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerObservationAuthorLookup } from "../repositories/OverviewCustomerObservationAuthorRepository";
import type { OverviewCustomerObservationRepository } from "../repositories/OverviewCustomerObservationRepository";
import { OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH } from "../schemas/overviewCustomerObservation.schemas";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import {
  assertOverviewCustomerAccess,
  type AssertOverviewCustomerAccessInput,
} from "../utils/assertOverviewCustomerAccess";
import type { OverviewCustomerObservationListItem } from "./ListOverviewCustomerObservationsUseCase";

export type CreateOverviewCustomerObservationInput =
  AssertOverviewCustomerAccessInput & {
    authorUserId: string;
    body: string;
  };

export type CreateOverviewCustomerObservationResult =
  OverviewCustomerObservationListItem;

export class CreateOverviewCustomerObservationUseCase {
  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly observations: OverviewCustomerObservationRepository,
    private readonly authors: OverviewCustomerObservationAuthorLookup,
  ) {}

  async execute(
    input: CreateOverviewCustomerObservationInput,
  ): Promise<CreateOverviewCustomerObservationResult> {
    await assertOverviewCustomerAccess(this.store, {
      customerCode: input.customerCode,
      role: input.role,
      codRep: input.codRep,
    });

    const trimmed = input.body.trim();
    if (trimmed.length === 0 || trimmed.length > OVERVIEW_CUSTOMER_OBSERVATION_MAX_BODY_LENGTH) {
      throw new AppError({
        message: "Corpo da observação inválido",
        statusCode: 400,
        code: "OBSERVATION_INVALID_BODY",
      });
    }

    const record = await this.observations.create({
      customerCode: input.customerCode,
      authorUserId: input.authorUserId,
      body: trimmed,
    });

    const authorMatches = await this.authors.findDisplayNamesByIds([
      record.authorUserId,
    ]);
    const authorDisplayName =
      authorMatches.find((match) => match.id === record.authorUserId)
        ?.displayName ?? "";

    return {
      id: record.id,
      customerCode: record.customerCode,
      authorUserId: record.authorUserId,
      authorDisplayName,
      body: record.body,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      editedAt: record.editedAt ? record.editedAt.toISOString() : null,
    };
  }
}
