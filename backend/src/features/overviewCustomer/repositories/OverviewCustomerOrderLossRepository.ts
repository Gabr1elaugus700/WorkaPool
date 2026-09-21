export type OverviewCustomerOrderLossMatch = {
  orderNumber: number;
  description: string;
};

export type OverviewCustomerOrderLossLookup = {
  findLossReasonsByOrderNumbers(
    orderNumbers: number[],
  ): Promise<OverviewCustomerOrderLossMatch[]>;
};

type OrderLossPrisma = {
  order: {
    findMany(args: {
      where: { orderNumber: { in: number[] } };
      select: {
        orderNumber: true;
        lossReason: { select: { description: true } };
      };
    }): Promise<
      Array<{
        orderNumber: number;
        lossReason: { description: string } | null;
      }>
    >;
  };
};

export class OverviewCustomerOrderLossRepository
  implements OverviewCustomerOrderLossLookup
{
  constructor(private readonly prisma: OrderLossPrisma) {}

  async findLossReasonsByOrderNumbers(
    orderNumbers: number[],
  ): Promise<OverviewCustomerOrderLossMatch[]> {
    if (orderNumbers.length === 0) {
      return [];
    }

    const rows = await this.prisma.order.findMany({
      where: { orderNumber: { in: orderNumbers } },
      select: {
        orderNumber: true,
        lossReason: { select: { description: true } },
      },
    });

    return rows.flatMap((row) => {
      if (!row.lossReason) {
        return [];
      }
      return [
        {
          orderNumber: row.orderNumber,
          description: row.lossReason.description,
        },
      ];
    });
  }
}
