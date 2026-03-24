"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Target,
  Landmark,
  FolderTree,
  MessageCircle,
  Shield,
  Users,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { isAdmin as checkIsAdmin } from "@/lib/actions/admin-actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/purchases", label: "Despesas", icon: ShoppingCart },
  { href: "/revenues", label: "Receitas", icon: DollarSign },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/patrimonies", label: "Patrimônio", icon: Landmark },
  { href: "/categories", label: "Categorias", icon: FolderTree },
  { href: "/chat", label: "Assistente IA", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    checkIsAdmin().then(setAdmin);
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Letheus
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {admin && (
        <>
          <Separator />
          <nav className="space-y-1 px-3 py-3">
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/users")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              Usuários
            </Link>
            <Link
              href="/admin/families"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/families")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Famílias
            </Link>
          </nav>
        </>
      )}
    </aside>
  );
}
