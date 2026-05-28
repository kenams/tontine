"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Home,
  ListChecks,
  RadioTower,
  Settings,
  Shield,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Database },
  { href: "/admin/tontines", label: "Tontines", icon: ListChecks },
  { href: "/admin/alerts", label: "Alertes", icon: AlertTriangle },
  { href: "/admin/monitoring", label: "Monitoring", icon: RadioTower },
  { href: "/admin/logs", label: "Logs", icon: Activity },
  { href: "/admin/settings", label: "Parametres", icon: Settings }
];

export function AdminShell({
  children,
  adminName
}: {
  children: ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 px-4 py-3 backdrop-blur-2xl lg:h-dvh lg:border-b-0 lg:border-r lg:px-5 lg:py-6 light:bg-ivory/85">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-ink shadow-glow">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-black">TontineApp Admin</p>
              <p className="text-xs text-smoke">{adminName}</p>
            </div>
          </Link>
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto lg:mt-8 lg:block lg:space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-fit items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-smoke transition lg:min-w-0",
                  active && "bg-emerald-500 text-ink shadow-glow",
                  !active && "hover:bg-white/10 hover:text-ivory"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 hidden space-y-2 lg:block">
          <ThemeToggle />
          <LogoutButton />
          <div className="glass rounded-3xl p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black">
              <BarChart3 size={18} className="text-gold" />
              Mode test
            </div>
            <p className="text-xs leading-5 text-smoke">Stripe, Wave, Orange Money, MTN MoMo et Flutterwave sont prets en architecture stub.</p>
          </div>
        </div>
      </aside>
      <main className="px-4 py-5 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
