"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/context";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut size={17} />
      {t("profile", "logout")}
    </Button>
  );
}
