"use client";

import { Bell, Home, MessageCircle, Plus, ReceiptText, Settings, User, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type Props = {
  children: ReactNode;
  title?: string;
  user: {
    fullName: string;
    email: string;
  };
};

const nav = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/tontines", label: "Tontines", icon: Plus },
  { href: "/transactions", label: "Flux", icon: ReceiptText },
  { href: "/profile", label: "Profil", icon: User }
];

export function MobileShell({ children, user, title }: Props) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-transparent">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/70 px-4 py-3 backdrop-blur-2xl light:bg-ivory/75">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-sm font-black text-ink shadow-glow">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{title ?? "TontineApp"}</p>
              <p className="truncate text-xs text-smoke">{user.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-smoke transition hover:text-ivory"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-white/10 bg-ink/85 px-3 py-2 backdrop-blur-2xl safe-bottom light:bg-ivory/90">
        <div className="grid grid-cols-5 gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold text-smoke transition",
                  active && "bg-emerald-500 text-ink shadow-glow"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 hidden">
          <LogoutButton />
          <Link href="/chat">
            <MessageCircle size={17} />
          </Link>
          <Link href="/settings">
            <Settings size={17} />
          </Link>
        </div>
      </nav>
    </div>
  );
}
