"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BookOpen, Sparkles, Settings, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      href: "/",
      icon: LayoutGrid,
      label: "Início",
      active: isActive("/"),
    },
    {
      href: "/lessons/beginner",
      icon: BookOpen,
      label: "Lições",
      active: isActive("/lessons") || isActive("/lesson"),
    },
    {
      href: "/create-lessons",
      icon: Sparkles,
      label: "Criar",
      active: isActive("/create-lessons"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Ajustes",
      active: isActive("/settings"),
    },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-7">
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={22} />
          </span>
          <span>
            <span className="block font-sora text-[15px] font-bold tracking-tight text-slate-900">Cariockko</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">English practice</span>
          </span>
        </Link>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Menu principal</p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label, active }) => (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={19} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <Sparkles size={16} />
          </div>
          <p className="text-xs font-semibold text-slate-800">Pratique um pouco todo dia</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">Pequenos passos constroem confiança para conversar.</p>
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white/95 pb-safe shadow-[0_-8px_24px_rgba(27,39,68,0.06)] backdrop-blur"
        aria-label="Navegação principal"
      >
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 py-2 ${
              active ? "text-indigo-700" : "text-slate-400"
            }`}
          >
            <Icon size={19} strokeWidth={1.9} />
            <span className="font-sora text-[10px] font-medium">{label}</span>
          </Link>
        ))}
        <ThemeToggle mobile />
      </nav>
    </>
  );
}
