"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type Point = { month: string; amount: number; currency: string };

export function SavingsChart({ data }: { data: Point[] }) {
  const hasData = data.some((d) => d.amount > 0);

  if (!hasData) {
    return (
      <div className="glass rounded-3xl p-4">
        <p className="mb-1 text-xs font-bold uppercase text-gold">Épargne cumulée</p>
        <p className="mb-4 text-lg font-black">Démarrez votre historique</p>
        <div className="flex h-24 items-center justify-center rounded-2xl bg-[var(--surface)]">
          <p className="text-xs text-[var(--muted)]">Effectuez votre première cotisation pour voir votre courbe d'épargne.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-4">
      <p className="mb-1 text-xs font-bold uppercase text-gold">Épargne cumulée</p>
      <p className="mb-4 text-lg font-black">{data[0]?.currency ?? "XOF"}</p>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#12c77f" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#12c77f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#b9c4bd" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#08110d", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 12 }}
            formatter={(v: number) => [`${v.toLocaleString("fr-FR")} ${data[0]?.currency ?? ""}`, "Épargne"]}
          />
          <Area type="monotone" dataKey="amount" stroke="#12c77f" strokeWidth={2} fill="url(#savGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
