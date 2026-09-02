import type { DefaultValues, FieldValues, Path } from "react-hook-form";
import type { ZodType, ZodTypeDef } from "zod";

export type FormBuilderOption = {
  value: string;
  label: string;
};

export type FormBuilderFieldType =
  | "text"
  | "password"
  | "number"
  | "select"
  | "checkbox";

export type FormBuilderField<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  type: FormBuilderFieldType;
  placeholder?: string;
  description?: string;
  options?: FormBuilderOption[];
  disabled?: boolean;
  /** When false, field is omitted from the layout (still in form state). */
  visible?: (values: TFieldValues) => boolean;
  className?: string;
};

export type FormBuilderSection<TFieldValues extends FieldValues> = {
  title: string;
  fields: FormBuilderField<TFieldValues>[];
};

export type FormBuilderProps<TFieldValues extends FieldValues> = {
  schema: ZodType<TFieldValues, ZodTypeDef, unknown>;
  sections: FormBuilderSection<TFieldValues>[];
  defaultValues: DefaultValues<TFieldValues>;
  values?: DefaultValues<TFieldValues>;
  onSubmit: (data: TFieldValues) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  submitting?: boolean;
};
