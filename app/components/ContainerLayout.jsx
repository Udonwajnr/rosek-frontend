"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "./Breadcrumb";
import { useAuth } from "../auth/auth-context";
import {
  LayoutDashboard,
  Boxes,
  Users,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  HeartPulse,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  CalendarClock,
  BarChart3,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/dashboard/dispense",
        label: "Dispense",
        icon: Sparkles,
        badge: "AI",
      },
    ],
  },
  {
    label: "Pharmacy",
    items: [
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
      { href: "/dashboard/user", label: "Patients", icon: Users },
    ],
  },
  {
    label: "Stock control",
    items: [
      { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
      {
        href: "/dashboard/purchase-orders",
        label: "Purchase orders",
        icon: ClipboardList,
      },
      {
        href: "/dashboard/stock",
        label: "Stock ledger",
        icon: ArrowLeftRight,
        exact: true,
      },
      { href: "/dashboard/stock/expiry", label: "Expiry", icon: CalendarClock },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

function NavLink({ item, pathname, onNavigate }) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ pathname, hospitalName, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight tracking-tight">
            Rosek
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {hospitalName || "Pharmacy management"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto rosek-scroll px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t px-3 py-3">
        <NavLink
          item={{
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings,
          }}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function ContainerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, hospitalData } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-card lg:flex">
        <SidebarContent
          pathname={pathname}
          hospitalName={hospitalData?.name}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex flex-1 flex-col lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent
                pathname={pathname}
                hospitalName={hospitalData?.name}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>

          <Breadcrumbs />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {(hospitalData?.name || "R").charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
