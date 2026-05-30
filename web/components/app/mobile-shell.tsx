"use client";

import { Bell, Home, Plus, ReceiptText, User, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type Props = {
  children: ReactNode;
  title?: string;
  user: { fullName: string; email: string };
};

const nav = [
  { href: "/dashboard",    label: "Accueil",  icon: Home },
  { href: "/wallet",       label: "Wallet",   icon: WalletCards },
  { href: "/tontines",     label: "Groupes",  icon: Plus },
  { href: "/transactions", label: "Flux",     icon: ReceiptText },
  { href: "/profile",      label: "Profil",   icon: User },
];

export function MobileShell({ children, user, title }: Props) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--surface-strong)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-sm font-black text-ink shadow-glow">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--text)]">{title ?? "Kotizy"}</p>
              <p className="truncate text-[10px] text-[var(--muted)]">{user.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--text)]"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {children}
        <div className="mt-8 flex flex-wrap justify-center gap-3 pb-2 text-[10px] text-[var(--muted)]">
          <Link href="/legal/cgu" className="hover:text-[var(--text)]">CGU</Link>
          <Link href="/legal/confidentialite" className="hover:text-[var(--text)]">Confidentialité</Link>
          <Link href="/legal/mentions-legales" className="hover:text-[var(--text)]">Mentions légales</Link>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-[var(--surface-strong)] bg-[var(--bg)]/92 px-3 py-2 backdrop-blur-2xl safe-bottom">
        <div className="grid grid-cols-5 gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition",
                  active
                    ? "bg-emerald-500 text-ink shadow-glow"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
