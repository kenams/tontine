"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SearchBox({ placeholder = "Recherche" }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm">
      <Search size={17} className="text-smoke" />
      <input
        defaultValue={searchParams.get("q") ?? ""}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-smoke"
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          if (event.target.value) params.set("q", event.target.value);
          else params.delete("q");
          startTransition(() => router.push(`?${params.toString()}`));
        }}
      />
      {pending ? <span className="text-xs text-gold">...</span> : null}
    </label>
  );
}
