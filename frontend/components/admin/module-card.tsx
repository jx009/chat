type ModuleCardProps = {
  title: string;
  description: string;
  statusLabel: string;
};

export function ModuleCard({
  title,
  description,
  statusLabel,
}: ModuleCardProps) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <span className="rounded-full bg-[#f5eee6] px-3 py-1 text-xs font-medium text-[var(--accent)]">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
