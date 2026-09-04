import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import type { FormBuilderSection } from "@/components/form-builder/formBuilder.types";
import { departamentosService } from "@/features/departamentos/services/departamentosService";
import type { Departamento } from "@/features/departamentos/models/departamentosModel";
import type { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import { USER_ROLE_LABELS, USER_ROLES, type UserRole } from "../types/user.types";

const ROLES_REQUIRING_DEPARTMENT: UserRole[] = ["GERENTE_DPTO", "ALMOX"];

const userFormSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    user: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
    password: z.string().optional(),
    role: z.enum(USER_ROLES, { required_error: "Nível de acesso é obrigatório" }),
    codRep: z.preprocess(
      (value) =>
        value === "" || value === null || (typeof value === "number" && Number.isNaN(value))
          ? undefined
          : value,
      z.number().int().positive().optional(),
    ),
    departamentoId: z.string().optional(),
    funcao: z.enum(["GERENTE", "FUNCIONARIO"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "VENDAS" && (data.codRep === undefined || data.codRep <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codRep"],
        message: "codRep é obrigatório para VENDAS",
      });
    }

    if (ROLES_REQUIRING_DEPARTMENT.includes(data.role) && !data.departamentoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departamentoId"],
        message: "Departamento é obrigatório para esta role",
      });
    }
  });

type UserFormValues = z.infer<typeof userFormSchema>;

type Props = {
  user?: User | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  onSuccess: () => void;
};

function firstDepartamentoId(user: User | null | undefined): string {
  if (!user?.departamentos || !Array.isArray(user.departamentos)) {
    return "";
  }
  const first = user.departamentos[0];
  if (!first) {
    return "";
  }
  if (typeof first === "string") {
    return first;
  }
  return first.departamento?.id ?? "";
}

export function UserForm({
  user,
  open: controlledOpen,
  onOpenChange,
  triggerLabel,
  onSuccess,
}: Props) {
  const isEdit = Boolean(user);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [submitting, setSubmitting] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void departamentosService
      .getAll()
      .then(setDepartamentos)
      .catch(() => toast.error("Não foi possível carregar departamentos"));
  }, [open]);

  const defaultValues: UserFormValues = useMemo(
    () => ({
      name: user?.name ?? "",
      user: user?.user ?? "",
      password: "",
      role: (user?.role as UserRole | undefined) ?? "USER",
      codRep: user?.codRep && user.codRep > 0 ? user.codRep : undefined,
      departamentoId: firstDepartamentoId(user) || undefined,
      funcao:
        user?.funcao === "GERENTE" || user?.funcao === "FUNCIONARIO"
          ? user.funcao
          : "FUNCIONARIO",
    }),
    [user],
  );

  const sections: FormBuilderSection<UserFormValues>[] = useMemo(
    () => [
      {
        title: "Identidade",
        fields: [
          {
            name: "name",
            label: "Nome",
            type: "text",
            placeholder: "Nome completo",
          },
          {
            name: "user",
            label: "Login",
            type: "text",
            placeholder: "usuario.login",
            disabled: isEdit,
            description: isEdit ? "Login não pode ser alterado." : undefined,
          },
          {
            name: "password",
            label: "Senha temporária",
            type: "password",
            placeholder: "Mínimo 6 caracteres",
            visible: () => !isEdit,
            description: "O usuário deverá trocar no primeiro acesso.",
            className: "sm:col-span-2",
          },
        ],
      },
      {
        title: "Acesso",
        fields: [
          {
            name: "role",
            label: "Nível de acesso",
            type: "select",
            options: USER_ROLES.map((role) => ({
              value: role,
              label: USER_ROLE_LABELS[role],
            })),
          },
          {
            name: "codRep",
            label: "Código representante (codRep)",
            type: "number",
            placeholder: "Ex.: 123",
            visible: (values) => values.role === "VENDAS",
            description: "Obrigatório para role VENDAS.",
          },
        ],
      },
      {
        title: "Departamento",
        fields: [
          {
            name: "departamentoId",
            label: "Departamento",
            type: "select",
            options: departamentos
              .filter((departamento) => Boolean(departamento.id))
              .map((departamento) => ({
                value: String(departamento.id),
                label: departamento.name.toUpperCase(),
              })),
            description: "Obrigatório para Gerente de departamento e Almoxarifado.",
          },
          {
            name: "funcao",
            label: "Função no departamento",
            type: "select",
            options: [
              { value: "GERENTE", label: "Gerente" },
              { value: "FUNCIONARIO", label: "Funcionário" },
            ],
            visible: (values) => Boolean(values.departamentoId),
          },
        ],
      },
    ],
    [departamentos, isEdit],
  );

  const createSchema = useMemo(
    () =>
      userFormSchema.superRefine((data, ctx) => {
        if (!isEdit && (!data.password || data.password.length < 6)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: "Senha deve ter pelo menos 6 caracteres",
          });
        }
      }),
    [isEdit],
  );

  const syncDepartment = async (
    userId: string,
    departamentoId: string | undefined,
    funcao: "GERENTE" | "FUNCIONARIO" | undefined,
  ) => {
    if (!departamentoId || !funcao) {
      return;
    }

    const previousDepartamentoId = firstDepartamentoId(user);
    const payload = { userId, departamentoId, funcao };

    if (previousDepartamentoId && previousDepartamentoId === departamentoId) {
      await usersService.updateDepartmentFunction(payload);
      return;
    }

    if (previousDepartamentoId && previousDepartamentoId !== departamentoId) {
      await usersService.removeFromDepartment(userId, previousDepartamentoId);
    }

    await usersService.addToDepartment(payload);
  };

  const handleSubmit = async (data: UserFormValues) => {
    setSubmitting(true);
    try {
      if (isEdit && user) {
        await usersService.updateUser(user.id, {
          name: data.name,
          role: data.role,
          codRep: data.role === "VENDAS" ? data.codRep : undefined,
        });
        await syncDepartment(user.id, data.departamentoId, data.funcao);
        toast.success("Usuário atualizado");
      } else {
        if (!data.password) {
          throw new Error("Senha temporária é obrigatória");
        }

        const created = await usersService.create({
          name: data.name,
          user: data.user,
          password: data.password,
          role: data.role,
          codRep: data.role === "VENDAS" ? data.codRep : undefined,
          departamentoId: data.departamentoId || undefined,
        });

        if (data.departamentoId && data.funcao) {
          await usersService.updateDepartmentFunction({
            userId: created.id,
            departamentoId: data.departamentoId,
            funcao: data.funcao,
          });
        }

        toast.success("Usuário criado");
      }

      setOpen(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar usuário";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerLabel ? (
        <DialogTrigger asChild>
          <Button variant={isEdit ? "outline" : "default"} size="sm">
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize acesso e vínculo de departamento. A senha é alterada pelo fluxo de reset."
              : "Cadastro administrativo com senha temporária. O usuário trocará a senha no primeiro acesso."}
          </DialogDescription>
        </DialogHeader>
        <FormBuilder
          schema={createSchema}
          sections={sections}
          defaultValues={defaultValues}
          values={open ? defaultValues : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitting={submitting}
          submitLabel={isEdit ? "Salvar alterações" : "Criar usuário"}
        />
      </DialogContent>
    </Dialog>
  );
}
