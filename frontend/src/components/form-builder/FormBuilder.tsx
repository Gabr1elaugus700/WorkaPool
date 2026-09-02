import { useEffect } from "react";
import {
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  FormBuilderField,
  FormBuilderProps,
} from "./formBuilder.types";

function FieldControl<TFieldValues extends FieldValues>({
  field,
  control,
}: {
  field: FormBuilderField<TFieldValues>;
  control: ReturnType<typeof useForm<TFieldValues>>["control"];
}) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: rhfField }) => (
        <FormItem className={cn(field.className)}>
          {field.type === "checkbox" ? (
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={Boolean(rhfField.value)}
                  disabled={field.disabled}
                  onCheckedChange={(checked) => rhfField.onChange(checked === true)}
                />
              </FormControl>
              <div className="grid gap-1">
                <FormLabel className="cursor-pointer font-normal">{field.label}</FormLabel>
                {field.description ? (
                  <FormDescription>{field.description}</FormDescription>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <FormLabel>{field.label}</FormLabel>
              {field.type === "select" ? (
                <Select
                  disabled={field.disabled}
                  value={rhfField.value ? String(rhfField.value) : undefined}
                  onValueChange={rhfField.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder ?? "Selecione"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...rhfField}
                    value={
                      rhfField.value === undefined || rhfField.value === null
                        ? ""
                        : String(rhfField.value)
                    }
                    onChange={(event) => {
                      if (field.type === "number") {
                        const raw = event.target.value;
                        rhfField.onChange(raw === "" ? undefined : event.target.valueAsNumber);
                        return;
                      }
                      rhfField.onChange(event.target.value);
                    }}
                  />
                </FormControl>
              )}
              {field.description ? (
                <FormDescription>{field.description}</FormDescription>
              ) : null}
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormBuilder<TFieldValues extends FieldValues>({
  schema,
  sections,
  defaultValues,
  values,
  onSubmit,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  onCancel,
  submitting = false,
}: FormBuilderProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (values) {
      form.reset(values);
    }
  }, [values, form]);

  const watched = useWatch({ control: form.control }) as TFieldValues;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {sections.map((section, sectionIndex) => {
          const visibleFields = section.fields.filter(
            (field) => field.visible?.(watched) !== false,
          );
          if (visibleFields.length === 0) {
            return null;
          }

          return (
            <div key={section.title} className="space-y-3">
              {sectionIndex > 0 ? <Separator /> : null}
              <p className="text-sm font-medium">{section.title}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleFields.map((field) => (
                  <FieldControl
                    key={String(field.name)}
                    field={field}
                    control={form.control}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
