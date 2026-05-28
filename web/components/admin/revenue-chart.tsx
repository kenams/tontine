"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { money } from "@/lib/format";

type Point = { month: string; volume: number; risk: number };

export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  return (
    <div className="glass h-80 rounded-3xl p-5">
      <div className="mb-4">
        <p className="text-sm font-black">Volume et risque</p>
        <p className="text-xs text-smoke">Evolution simulee des contributions traitees.</p>
      </div>
      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#12c77f" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#12c77f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="#b9c4bd" tickLine={false} axisLine={false} />
          <YAxis stroke="#b9c4bd" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 100000)}k`} />
          <Tooltip
            contentStyle={{
              background: "#08110d",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              color: "#f7f3e8"
            }}
            formatter={(value) => money(Number(value), currency)}
          />
          <Area type="monotone" dataKey="volume" stroke="#12c77f" strokeWidth={3} fill="url(#volume)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
