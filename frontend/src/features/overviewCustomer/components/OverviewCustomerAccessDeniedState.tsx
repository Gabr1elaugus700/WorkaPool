import React from "react";

type OverviewCustomerAccessDeniedStateProps = {
  backHref?: string;
};

export function OverviewCustomerAccessDeniedState({
  backHref = "/overview/customers",
}: OverviewCustomerAccessDeniedStateProps) {
  return (
    <section className="rounded-md border p-5">
      <h1 className="text-xl font-semibold">Acesso negado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Você não tem permissão para visualizar este cliente.
      </p>
      <a
        href={backHref}
        className="mt-4 inline-block text-sm text-primary underline"
      >
        Voltar para lista de clientes
      </a>
    </section>
  );
}
