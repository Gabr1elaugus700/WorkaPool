import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import { buildOverviewCustomerGroupQuoteWindow } from "../utils/buildOverviewCustomerGroupQuoteWindow";
import { OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL } from "./overviewCustomerGroupQuotes.sql";

export type OverviewCustomerGroupQuotesQueryInput = {
  grpPro: string;
  dataInicio: string;
  dataFimExclusiva: string;
};

export type OverviewCustomerGroupQuoteSeniorLine = {
  datemi: string;
  numped: number;
  sitped: number;
  codRep: number;
  aperep: string | null;
  codcli: number;
  apecli: string | null;
  productName: string | null;
  codpro: string;
  codgrp: string;
  ipi: number | null;
  icm: number | null;
  icmsPercent: number | null;
  qtdped: number;
  preuni: number;
  vlrfinal: number;
  margem: number | null;
  preCusto: number | null;
  frete: number | null;
  transportadora: number | null;
  freteIncluso: boolean | null;
};

export type OverviewCustomerGroupQuotesSeniorReader = {
  fetchLines(
    input: OverviewCustomerGroupQuotesQueryInput,
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]>;
};

type SeniorGroupQuoteRecord = {
  DATA: string | Date | null;
  NUMPED: number;
  SITUACAO: number;
  CODREP: number;
  APEREP: string | null;
  CODCLI: number;
  FANTASIA: string | null;
  NOME_PRO: string | null;
  CODPRO: string | number;
  CODGRP: string | null;
  IPI: number | null;
  ICM: number | null;
  ICMS: number | null;
  QTDPED: number;
  PREUNI: number;
  VLRFINAL: number;
  MARGEM_LUCRO: number | null;
  PRE_CUSTO: number | null;
  FRETE: number | null;
  TRANSPORTADORA: number | null;
  INCLUSO: string | number | boolean | null;
};

export class OverviewCustomerGroupQuotesSeniorQuery
  implements OverviewCustomerGroupQuotesSeniorReader
{
  async fetchLines(
    input: OverviewCustomerGroupQuotesQueryInput,
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    await sqlPoolConnect;
    const request = sqlPool.request();
    request.input("grpPro", input.grpPro);
    request.input("dataInicio", input.dataInicio);
    request.input("dataFimExclusiva", input.dataFimExclusiva);
    const result = await request.query<SeniorGroupQuoteRecord>(
      OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL,
    );
    return mapGroupQuoteLines(result.recordset);
  }

  async fetchLinesForWindow(
    grpPro: string,
    now: Date = new Date(),
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    const window = buildOverviewCustomerGroupQuoteWindow(now);
    return this.fetchLines({
      grpPro,
      dataInicio: window.dataInicio,
      dataFimExclusiva: window.dataFimExclusiva,
    });
  }
}

export function mapGroupQuoteLines(
  records: SeniorGroupQuoteRecord[],
): OverviewCustomerGroupQuoteSeniorLine[] {
  const lines: OverviewCustomerGroupQuoteSeniorLine[] = [];
  for (const record of records) {
    const datemi = toIsoDate(record.DATA);
    const numped = Number(record.NUMPED);
    const sitped = Number(record.SITUACAO);
    const codRep = Number(record.CODREP);
    const codcli = Number(record.CODCLI);
    const codpro = String(record.CODPRO ?? "").trim();
    const qtdped = Number(record.QTDPED);
    const preuni = Number(record.PREUNI);
    const vlrfinal = Number(record.VLRFINAL);
    if (
      datemi === null ||
      !Number.isInteger(numped) ||
      numped <= 0 ||
      !Number.isInteger(sitped) ||
      (sitped !== 5 && sitped !== 9) ||
      !Number.isInteger(codRep) ||
      codRep <= 0 ||
      !Number.isInteger(codcli) ||
      codcli <= 0 ||
      codpro.length === 0 ||
      !Number.isFinite(qtdped) ||
      !Number.isFinite(preuni) ||
      !Number.isFinite(vlrfinal)
    ) {
      continue;
    }

    lines.push({
      datemi,
      numped,
      sitped,
      codRep,
      aperep: normalizeOptionalString(record.APEREP),
      codcli,
      apecli: normalizeOptionalString(record.FANTASIA),
      productName: normalizeOptionalString(record.NOME_PRO),
      codpro,
      codgrp: String(record.CODGRP ?? "").trim(),
      ipi: toNullableNumber(record.IPI),
      icm: toNullableNumber(record.ICM),
      icmsPercent: toNullableNumber(record.ICMS),
      qtdped,
      preuni,
      vlrfinal,
      margem: toNullableNumber(record.MARGEM_LUCRO),
      preCusto: toNullableNumber(record.PRE_CUSTO),
      frete: toNullableNumber(record.FRETE),
      transportadora: toNullableNumber(record.TRANSPORTADORA),
      freteIncluso: toFreightIncluded(record.INCLUSO),
    });
  }
  return lines;
}

function toIsoDate(value: string | Date | null): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }
  return null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFreightIncluded(
  value: string | number | boolean | null | undefined,
): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "S" || normalized === "SIM" || normalized === "Y" || normalized === "1") {
    return true;
  }
  if (normalized === "N" || normalized === "NAO" || normalized === "NÃO" || normalized === "0") {
    return false;
  }
  return null;
}
