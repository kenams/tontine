"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

export function UserStatusActions({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);

  return (
    <div className="flex items-center gap-2">
      <StatusBadge value={value} />
      <select
        value={value}
        onChange={async (event) => {
          const next = event.target.value;
          setValue(next);
          await fetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next })
          });
          router.refresh();
        }}
        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.08] px-2 text-xs outline-none"
      >
        <option value="ACTIVE">Actif</option>
        <option value="REVIEW">Review</option>
        <option value="SUSPENDED">Suspendu</option>
        <option value="BANNED">Banni</option>
      </select>
    </div>
  );
}
