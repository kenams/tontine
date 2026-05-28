import type { ReactNode } from "react";

export function AdminStatCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase text-smoke">{label}</p>
        {icon ? <div className="text-emerald-400">{icon}</div> : null}
      </div>
      <p className="break-words text-2xl font-black leading-tight tracking-normal">{value}</p>
      {detail ? <p className="mt-2 text-sm text-smoke">{detail}</p> : null}
    </div>
  );
}
