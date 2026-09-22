export type OverviewCustomerObservationRecord = {
  id: string;
  customerCode: number;
  authorUserId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
};

export type OverviewCustomerObservationBeforeCursor = {
  createdAt: Date;
  id: string;
};

export type OverviewCustomerObservationCreateInput = {
  customerCode: number;
  authorUserId: string;
  body: string;
};

export type OverviewCustomerObservationUpdateByAuthorInput = {
  id: string;
  customerCode: number;
  authorUserId: string;
  body: string;
  editedAt: Date;
};

type ObservationFindManyArgs = {
  where: {
    customerCode: number;
    OR?: Array<
      | { createdAt: { lt: Date } }
      | { AND: Array<{ createdAt: Date } | { id: { lt: string } }> }
    >;
  };
  orderBy: Array<{ createdAt: "desc" } | { id: "desc" }>;
  take: number;
};

type ObservationPrisma = {
  overviewCustomerObservation: {
    findMany(
      args: ObservationFindManyArgs,
    ): Promise<OverviewCustomerObservationRecord[]>;
    create(args: {
      data: {
        customerCode: number;
        authorUserId: string;
        body: string;
        editedAt: null;
      };
    }): Promise<OverviewCustomerObservationRecord>;
    findFirst(args: {
      where: {
        id: string;
        customerCode: number;
        authorUserId: string;
      };
    }): Promise<OverviewCustomerObservationRecord | null>;
    update(args: {
      where: { id: string };
      data: { body: string; editedAt: Date };
    }): Promise<OverviewCustomerObservationRecord>;
  };
};

export class OverviewCustomerObservationRepository {
  constructor(private readonly prisma: ObservationPrisma) {}

  async findRecentPage(
    customerCode: number,
    limit = 50,
    before?: OverviewCustomerObservationBeforeCursor,
  ): Promise<OverviewCustomerObservationRecord[]> {
    const where: ObservationFindManyArgs["where"] = { customerCode };

    if (before) {
      where.OR = [
        { createdAt: { lt: before.createdAt } },
        {
          AND: [{ createdAt: before.createdAt }, { id: { lt: before.id } }],
        },
      ];
    }

    const newestFirst = await this.prisma.overviewCustomerObservation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    return newestFirst.reverse();
  }

  async create(
    input: OverviewCustomerObservationCreateInput,
  ): Promise<OverviewCustomerObservationRecord> {
    return this.prisma.overviewCustomerObservation.create({
      data: {
        customerCode: input.customerCode,
        authorUserId: input.authorUserId,
        body: input.body,
        editedAt: null,
      },
    });
  }

  async updateByAuthor(
    input: OverviewCustomerObservationUpdateByAuthorInput,
  ): Promise<OverviewCustomerObservationRecord | null> {
    const existing = await this.prisma.overviewCustomerObservation.findFirst({
      where: {
        id: input.id,
        customerCode: input.customerCode,
        authorUserId: input.authorUserId,
      },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.overviewCustomerObservation.update({
      where: { id: input.id },
      data: {
        body: input.body,
        editedAt: input.editedAt,
      },
    });
  }
}
