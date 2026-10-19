import type { IbcPageTab } from "./filterIbcPageTabs";

export const EXPEDICAO_IBC_SECTIONS = [
  { id: "aguardando", to: "/expedicao-ibc", label: "Aguardando expedição" },
  { id: "em-viagem", to: "/expedicao-ibc/em-viagem", label: "Em viagem" },
  { id: "entrada", to: "/expedicao-ibc/entrada", label: "Entrada no pátio" },
] as const satisfies readonly IbcPageTab[];

export type ExpedicaoIbcSection = (typeof EXPEDICAO_IBC_SECTIONS)[number]["id"];

type StationTone = {
  label: string;
  stripeClass: string;
  badgeClass: string;
};

export const expedicaoIbcStationTone: Record<ExpedicaoIbcSection, StationTone> = {
  aguardando: {
    label: "Aguardando",
    stripeClass: "bg-amber-500",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  "em-viagem": {
    label: "Em viagem",
    stripeClass: "bg-blue-600",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
  },
  entrada: {
    label: "Entrada no pátio",
    stripeClass: "bg-primary",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};
