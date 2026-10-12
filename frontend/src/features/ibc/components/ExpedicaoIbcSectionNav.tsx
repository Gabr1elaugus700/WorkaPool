import { Link } from "react-router-dom";

const SECTIONS = [
  { id: "aguardando", to: "/expedicao-ibc", label: "Aguardando expedição" },
  { id: "em-viagem", to: "/expedicao-ibc/em-viagem", label: "Em viagem" },
] as const;

export type ExpedicaoIbcSection = (typeof SECTIONS)[number]["id"];

type Props = {
  active: ExpedicaoIbcSection;
};

/**
 * Troca entre a lista de cargas aguardando expedição e as que estão na rua.
 */
export default function ExpedicaoIbcSectionNav({ active }: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label="Expedição IBC">
      {SECTIONS.map((section) => {
        const current = section.id === active;
        return (
          <Link
            key={section.id}
            to={section.to}
            aria-current={current ? "page" : undefined}
            className={
              current
                ? "rounded-sm text-sm font-semibold text-foreground underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            }
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
