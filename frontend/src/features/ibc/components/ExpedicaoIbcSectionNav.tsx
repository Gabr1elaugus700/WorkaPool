import IbcPageTabs from "./IbcPageTabs";
import type { IbcPageTab } from "../utils/filterIbcPageTabs";

const SECTIONS = [
  { id: "aguardando", to: "/expedicao-ibc", label: "Aguardando expedição" },
  { id: "em-viagem", to: "/expedicao-ibc/em-viagem", label: "Em viagem" },
  { id: "entrada", to: "/expedicao-ibc/entrada", label: "Entrada no pátio" },
] as const satisfies readonly IbcPageTab[];

export type ExpedicaoIbcSection = (typeof SECTIONS)[number]["id"];

type Props = {
  active: ExpedicaoIbcSection;
};

export default function ExpedicaoIbcSectionNav({ active }: Props) {
  return <IbcPageTabs tabs={SECTIONS} activeId={active} ariaLabel="Expedição IBC" />;
}
