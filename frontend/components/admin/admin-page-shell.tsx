import { ReactNode } from "react";

type AdminPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function AdminPageShell({
  eyebrow = "Admin",
  title,
  description,
  children,
}: AdminPageShellProps) {
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}

