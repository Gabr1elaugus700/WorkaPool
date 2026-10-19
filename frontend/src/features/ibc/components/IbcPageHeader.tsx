import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  tabs?: ReactNode;
  children?: ReactNode;
};

export default function IbcPageHeader({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions,
  tabs,
  children,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-background">
      <div className="flex items-center gap-3">
        {icon}
        {subtitle ? (
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {tabs}
        {secondaryActions}
        {primaryAction}
        {children}
      </div>
    </div>
  );
}
