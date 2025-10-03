import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    options?: { value: string; label: string }[];
};

export default function FormField({ id, label, value, onChange, placeholder, type = "text", disabled, options }: FormFieldProps) {
  return (
    <div className="space-y-1 flex flex-col mt-4">
      <Label className="font-display" htmlFor={id}>{label}</Label>
      {options ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="h-12 rounded-lg bg-subtleGray border border-gray-300 dark:border-gray-700 dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark focus:ring-2 focus:ring-primary px-4 "
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-12 rounded-lg bg-subtleGray dark:bg-subtle-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark border-solid border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary px-4"
        />
      )}
    </div>
  );
}