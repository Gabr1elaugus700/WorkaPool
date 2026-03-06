import { PrismaClient } from "@prisma/client";
import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido, PedidoRaw } from "../entities/Pedido";
import { ICargoRepository } from "./ICargoRepository";
import { mapRawToPedidos } from "../mappers/PedidoMapper";

import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";

export class CargoRepository implements ICargoRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  async createCarga(carga: Carga): Promise<Carga> {
    await this.prisma.cargas.create({
      data: {
        id: carga.id,
        codCar: carga.codCar,
        destino: carga.destino,
        previsaoSaida: carga.previsaoSaida,
        createdAt: carga.createdAt,
        closedAt: carga.closedAt,
        situacao: carga.situacao,
        pesoMax: carga.pesoMaximo,
        custoMin: 0,
      },
    });
    return carga;
  }

  async getCargaById(id: string): Promise<Carga | null> {
    const carga = await this.prisma.cargas.findUnique({
      where: { id },
    });
    if (!carga) {
      return null;
    }
    return new Carga({
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      previsaoSaida: carga.previsaoSaida,
      createdAt: carga.createdAt,
      closedAt: carga.closedAt || undefined,
      situacao: carga.situacao as SituacaoCarga,
      pesoMaximo: carga.pesoMax,
    });
  }

  async updateCarga(id: string, carga: Carga): Promise<Carga> {
    await this.prisma.cargas.update({
      where: { id: id },
      data: {
        codCar: carga.codCar,
        destino: carga.destino,
        previsaoSaida: carga.previsaoSaida,
        createdAt: carga.createdAt,
        closedAt: carga.closedAt,
        situacao: carga.situacao,
        pesoMax: carga.pesoMaximo,
      },
    });
    return carga;
  }

  async deleteCarga(id: string): Promise<void> {
    await this.prisma.cargas.delete({
      where: { id },
    });
  }

  async getPedidosPorCarga(codCar: number): Promise<Pedido[]> {
    await sqlPoolConnect;

    const result = await sqlPool.request().input("codCar", codCar)
      .query<PedidoRaw>(`
                SELECT
                     ped.numped          AS [NUM_PED]
                    ,ped.codcli          AS [COD_CLI]
                    ,cli.nomcli          AS [CLIENTE]
                    ,cli.cidcli          AS [CIDADE]
                    ,cli.sigufs          AS [ESTADO]
                    ,rep.aperep          AS [VENDEDOR]
                    ,rep.codrep          AS [CODREP]
                    ,ped.pedblo          AS [BLOQUEADO]
                    ,sum(ipd.qtdped * der.pesbru) AS [PESO]
                    ,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
                    ,ipd.codder          AS [DERIVACAO]
                    ,ipd.qtdped          AS [QUANTIDADE]
                    ,ped.usu_codcar      AS [CODCAR]
                    ,ped.usu_poscar      AS [POSCAR]
                    ,ped.usu_sitcar      AS [SITCAR]
                    ,ped.qtdori AS [QTD_ORI_PED]
                FROM e120ped ped
                LEFT JOIN E120IPD ipd ON ipd.codemp = ped.codemp
                                     AND ipd.codfil = ped.codfil
                                     AND ipd.numped = ped.numped
                LEFT JOIN e075der der ON der.codemp = ipd.codemp
                                     AND der.codpro = ipd.codpro
                                     AND der.codder = ipd.codder
                LEFT JOIN e085cli cli ON cli.codcli = ped.codcli
                LEFT JOIN e090rep rep ON rep.codrep = ped.codven
                LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
                WHERE ped.sitped = 1
                  AND ped.codtra = 26
                  AND ped.usu_codcar = @codCar
                GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs,
                         rep.aperep, rep.codrep, ped.pedblo, ipd.codder, ipd.qtdped,
                         grp.desgrp, ped.usu_codcar, ped.usu_poscar, ped.usu_sitcar, ped.qtdori
            `);

    return mapRawToPedidos(result.recordset);
  }

  async getMaxCodCar(): Promise<number> {
    const result = await this.prisma.cargas.findFirst({
      orderBy: { codCar: "desc" },
    });
    return result ? result.codCar : 0;
  }

  async getCargas(situacao?: SituacaoCarga): Promise<Carga[]> {
    const cargas = await this.prisma.cargas.findMany({
      where: situacao ? { situacao } : undefined,
    });
    return cargas.map(
      (carga) =>
        new Carga({
          id: carga.id,
          codCar: carga.codCar,
          destino: carga.destino,
          previsaoSaida: carga.previsaoSaida,
          createdAt: carga.createdAt,
          closedAt: carga.closedAt || undefined,
          situacao: carga.situacao as SituacaoCarga,
          pesoMaximo: carga.pesoMax,
        }),
    );
  }

  async updatePedidoCarga(
    numPed: number,
    codCar: number,
    posCar: number,
  ): Promise<void> {
    await sqlPoolConnect;
    const result = await sqlPool
      .request()
      .input("codCar", codCar)
      .input("posCar", posCar)
      .input("numPed", numPed).query(`
            UPDATE e120ped 
            SET usu_codcar=@codCar 
               ,usu_poscar =@posCar
            WHERE numped =@numPed
        `);
    if (result.rowsAffected[0] === 0) {
      throw new Error(
        `Pedido ${numPed} não encontrado ou não pôde ser atualizado.`,
      );
    } else {
      console.log(
        `Pedido ${numPed} atualizado com sucesso para carga ${codCar} na posição ${posCar}.`,
      );
    }
  }

  async getPedidos(codRep?: number, codCar?: number): Promise<Pedido[]> {
    await sqlPoolConnect;

    
    const isAll = !codRep || codRep === 999;
    const request = sqlPool.request();

    if (!isAll) {
      request.input("codRep", codRep);
    }

    const result = await request.query<PedidoRaw>(`
      SELECT ped.numped          AS [NUM_PED]
            ,ped.codcli          AS [COD_CLI]
            ,cli.nomcli          AS [CLIENTE]
            ,cli.cidcli          AS [CIDADE]
            ,cli.sigufs          AS [ESTADO]
            ,rep.aperep          AS [VENDEDOR]
            ,rep.codrep          AS [CODREP]
            ,ped.pedblo          AS [BLOQUEADO]
            ,sum(ipd.qtdped * der.pesbru) AS [PESO]
            ,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
            ,ipd.codder          AS [DERIVACAO]
            ,ipd.qtdped          AS [QUANTIDADE]
            ,ISNULL(CAST(ped.usu_codCar AS INT), 0) AS [CODCAR]
            ,ISNULL(CAST(ped.usu_poscar AS INT), 0) AS [POSCAR]
            ,ped.usu_sitcar      AS [SITCAR]
            ,ped.qtdori AS [QTD_ORI_PED]
      FROM e120ped ped
      LEFT JOIN E120IPD ipd ON ipd.codemp = ped.codemp
                           AND ipd.codfil = ped.codfil
                           AND ipd.numped = ped.numped
      LEFT JOIN e075der der ON der.codemp = ipd.codemp
                           AND der.codpro = ipd.codpro
                           AND der.codder = ipd.codder
      LEFT JOIN e085cli cli ON cli.codcli = ped.codcli
      LEFT JOIN e090rep rep ON rep.codrep = ped.codven
      LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
      WHERE ped.sitped = 1
        AND ped.codtra = 26
        ${!isAll ? "AND rep.codrep = @codRep" : ""}
      GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs,
               rep.aperep, rep.codrep, ped.pedblo, ipd.codder, ipd.qtdped,
               grp.desgrp, ped.usu_codCar, ped.usu_poscar, ped.usu_sitcar, ped.qtdori
    `);

    return mapRawToPedidos(result.recordset);
  }

  async getPedidosWeight(numPed: number): Promise<{ numPed: number; peso: number }> {
    await sqlPoolConnect;
    const request = sqlPool.request();

    if (numPed) {
      request.input("numPed", numPed);
    }

    const result = await request.query<PedidoRaw>(`
      SELECT ped.numped          AS [NUM_PED]
            ,ped.codcli          AS [COD_CLI]
            ,cli.nomcli          AS [CLIENTE]
            ,cli.cidcli          AS [CIDADE]
            ,cli.sigufs          AS [ESTADO]
            ,rep.aperep          AS [VENDEDOR]
            ,rep.codrep          AS [CODREP]
            ,ped.pedblo          AS [BLOQUEADO]
            ,sum(ipd.qtdped * der.pesbru) AS [PESO]
            ,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
            ,ipd.codder          AS [DERIVACAO]
            ,ipd.qtdped          AS [QUANTIDADE]
            ,ISNULL(CAST(ped.usu_codCar AS INT), 0) AS [CODCAR]
            ,ISNULL(CAST(ped.usu_poscar AS INT), 0) AS [POSCAR]
            ,ped.usu_sitcar      AS [SITCAR]
            ,ped.qtdori AS [QTD_ORI_PED]
      FROM e120ped ped
      LEFT JOIN E120IPD ipd ON ipd.codemp = ped.codemp
                           AND ipd.codfil = ped.codfil
                           AND ipd.numped = ped.numped
      LEFT JOIN e075der der ON der.codemp = ipd.codemp
                           AND der.codpro = ipd.codpro
                           AND der.codder = ipd.codder
      LEFT JOIN e085cli cli ON cli.codcli = ped.codcli
      LEFT JOIN e090rep rep ON rep.codrep = ped.codven
      LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
      WHERE ped.sitped = 1
        AND ped.codtra = 26
        AND ped.numped = @numPed
      GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs,
               rep.aperep, rep.codrep, ped.pedblo, ipd.codder, ipd.qtdped,
               grp.desgrp, ped.usu_codCar, ped.usu_poscar, ped.usu_sitcar, ped.qtdori
    `);

    if (result.recordset.length === 0) {
      throw new Error(`Pedido ${numPed} não encontrado.`);
    }

    return {
        numPed: Number(result.recordset[0].NUM_PED),
      peso: Number(result.recordset[0].PESO),
    };
  }
  async updateSituacaoCarga(
    codCar: number,
    situacao: SituacaoCarga,
  ): Promise<Carga> {
    const carga = await this.prisma.cargas.update({
      where: { codCar },
      data: { situacao },
    });

    return new Carga({
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      previsaoSaida: carga.previsaoSaida,
      createdAt: carga.createdAt,
      closedAt: carga.closedAt || undefined,
      situacao: carga.situacao as SituacaoCarga,
      pesoMaximo: carga.pesoMax,
    });
  }

  async getLastHistoricoPesoPedido(
    numPed: number,
  ): Promise<{
    peso: number;
    codCar: number;
    numPed: number;
    createdAt: Date;
  } | null> {
    const result = await this.prisma.historicoPesoPedidos.findFirst({
      where: { numPed },
      orderBy: { createdAt: "desc" },
      include: { carga: true },
    });
    if (!result) {
      return null;
    }
    return {
      peso: result.peso,
      codCar: result.carga.codCar,
      numPed: result.numPed,
      createdAt: result.createdAt,
    };
  }

  async createHistoricoPesoPedido(
    numPed: number,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    await this.prisma.historicoPesoPedidos.create({
      data: {
        numPed,
        cargaId,
        peso,
      },
    });
  }
}
