export type OverviewCustomerSellerNameMatch = {
  codRep: number;
  name: string;
};

export type OverviewCustomerSellerNameLookup = {
  findNamesByCodReps(
    codReps: number[],
  ): Promise<OverviewCustomerSellerNameMatch[]>;
};

type SellerNamePrisma = {
  user: {
    findMany(args: {
      where: { codRep: { in: number[] } };
      select: {
        id: true;
        name: true;
        codRep: true;
      };
    }): Promise<
      Array<{
        id: string;
        name: string;
        codRep: number;
      }>
    >;
  };
};

export class OverviewCustomerSellerNameRepository
  implements OverviewCustomerSellerNameLookup
{
  constructor(private readonly prisma: SellerNamePrisma) {}

  async findNamesByCodReps(
    codReps: number[],
  ): Promise<OverviewCustomerSellerNameMatch[]> {
    if (codReps.length === 0) {
      return [];
    }

    const rows = await this.prisma.user.findMany({
      where: { codRep: { in: codReps } },
      select: {
        id: true,
        name: true,
        codRep: true,
      },
    });

    const bestByCodRep = new Map<number, { id: string; name: string }>();

    for (const row of rows) {
      const trimmed = row.name.trim();
      if (trimmed.length === 0) {
        continue;
      }

      const existing = bestByCodRep.get(row.codRep);
      if (!existing) {
        bestByCodRep.set(row.codRep, { id: row.id, name: trimmed });
        continue;
      }

      const nameCompare = trimmed.localeCompare(existing.name, undefined, {
        sensitivity: "base",
      });
      if (
        nameCompare < 0 ||
        (nameCompare === 0 && row.id.localeCompare(existing.id) < 0)
      ) {
        bestByCodRep.set(row.codRep, { id: row.id, name: trimmed });
      }
    }

    return [...bestByCodRep.entries()].map(([codRep, value]) => ({
      codRep,
      name: value.name,
    }));
  }
}
