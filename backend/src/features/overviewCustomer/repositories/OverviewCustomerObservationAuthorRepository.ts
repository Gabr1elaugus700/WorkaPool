export type OverviewCustomerObservationAuthorMatch = {
  id: string;
  displayName: string;
};

export type OverviewCustomerObservationAuthorLookup = {
  findDisplayNamesByIds(
    ids: string[],
  ): Promise<OverviewCustomerObservationAuthorMatch[]>;
};

type AuthorNamePrisma = {
  user: {
    findMany(args: {
      where: { id: { in: string[] } };
      select: {
        id: true;
        name: true;
        user: true;
      };
    }): Promise<
      Array<{
        id: string;
        name: string;
        user: string;
      }>
    >;
  };
};

export class OverviewCustomerObservationAuthorRepository
  implements OverviewCustomerObservationAuthorLookup
{
  constructor(private readonly prisma: AuthorNamePrisma) {}

  async findDisplayNamesByIds(
    ids: string[],
  ): Promise<OverviewCustomerObservationAuthorMatch[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        user: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      displayName: row.name.trim() || row.user,
    }));
  }
}
