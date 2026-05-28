"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageComposer({ groupId }: { groupId: string }) {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "");
    if (!content.trim()) return;
    const response = await fetch(`/api/tontines/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (response.ok) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="sticky bottom-24 z-20 flex gap-2 rounded-3xl border border-white/10 bg-ink/85 p-2 backdrop-blur-xl">
      <Input name="content" placeholder="Message au groupe" required />
      <Button className="shrink-0 rounded-2xl px-3" aria-label="Envoyer">
        <Send size={18} />
      </Button>
    </form>
  );
}
