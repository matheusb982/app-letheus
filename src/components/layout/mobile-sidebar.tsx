"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Target,
  Landmark,
  FolderTree,
  MessageCircle,
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

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    checkIsAdmin().then(setAdmin);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className="flex h-14 flex-col justify-center px-6">
          <Link href="/dashboard" className="text-lg font-bold leading-tight" onClick={() => setOpen(false)}>
            Letheus IA Financeira
          </Link>
          <span className="text-[10px] text-sidebar-foreground/50">Seu assistente financeiro com IA</span>
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
                onClick={() => setOpen(false)}
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
            <nav className="px-3 py-3">
              <Link
                href="/admin/families"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
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
      </SheetContent>
    </Sheet>
  );
}
