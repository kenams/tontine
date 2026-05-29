"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/notifications/read", { method: "POST" });
        setLoading(false);
        router.refresh();
      }}
      className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
    >
      <CheckCheck size={14} />
      {loading ? "..." : "Tout lire"}
    </button>
  );
}
