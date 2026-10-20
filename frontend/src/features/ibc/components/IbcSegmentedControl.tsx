import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { nextSegmentIndex } from "@/utils/nextSegmentIndex";

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  ariaLabel: string;
  options: readonly Option<T>[];
  value: T | null;
  disabled?: boolean;
  onChange: (value: T) => void;
};

/** Escolha exclusiva entre poucas opções (radiogroup com foco itinerante). */
export default function IbcSegmentedControl<T extends string>({
  ariaLabel,
  options,
  value,
  disabled = false,
  onChange,
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.id === value);
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextSegmentIndex(index, event.key, options.length);
    if (next == null) return;
    event.preventDefault();
    onChange(options[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-md bg-muted p-1"
    >
      {options.map((option, index) => {
        const checked = option.id === value;
        return (
          <button
            key={option.id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "h-8 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
              checked
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
