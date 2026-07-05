"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "../axios/axiosConfig";
import { useAuth } from "../auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Boxes,
  AlertTriangle,
  CalendarClock,
  Banknote,
  Plus,
  Sparkles,
  ArrowRight,
  Pill,
} from "lucide-react";

/* Dashboard — everything below is computed from live inventory + patient data. */

const STAT_STYLES = {
  teal: "bg-primary/10 text-primary",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

function StatCard({ icon: Icon, tone, label, value, hint, href }) {
  const body = (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-3 p-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${STAT_STYLES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashBoardHome() {
  const { hospitalData } = useAuth();
  const [patients, setPatients] = useState(null);
  const [inventory, setInventory] = useState(null);

  useEffect(() => {
    const hospitalId = typeof window !== "undefined" ? localStorage.getItem("_id") : null;
    if (!hospitalId) return;
    api
      .get(`/api/user/hospital/${hospitalId}/users`)
      .then((res) => setPatients(res.data || []))
      .catch(() => setPatients([]));
    api
      .get(`/api/medication/${hospitalId}/medications`)
      .then((res) => setInventory(res.data || []))
      .catch(() => setInventory([]));
  }, []);

  const loading = patients === null || inventory === null;

  const stats = useMemo(() => {
    if (loading) return null;
    const now = Date.now();
    const in30days = now + 30 * 24 * 3600 * 1000;

    const lowStock = inventory.filter(
      (m) => m.quantityInStock > 0 && m.quantityInStock <= (m.reorderLevel || 10)
    );
    const outOfStock = inventory.filter((m) => (m.quantityInStock || 0) <= 0);
    const expiringSoon = inventory.filter((m) => {
      const t = new Date(m.expiryDate).getTime();
      return t > now && t <= in30days;
    });
    const stockValue = inventory.reduce(
      (sum, m) => sum + (m.price || 0) * (m.quantityInStock || 0),
      0
    );
    const activePrescriptions = patients.reduce(
      (sum, p) => sum + (p.medications?.filter((x) => x.current)?.length || 0),
      0
    );

    return { lowStock, outOfStock, expiringSoon, stockValue, activePrescriptions };
  }, [loading, patients, inventory]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-teal-800 to-teal-600 px-6 py-7 text-primary-foreground sm:px-8">
        <Pill
          className="pointer-events-none absolute -right-6 -top-8 h-52 w-52 rotate-[30deg] text-white/10"
          strokeWidth={1}
        />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}{hospitalData?.name ? `, ${hospitalData.name}` : ""}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
            Track stock, dispense safely with live AI interaction checks, and keep every
            patient's medication schedule on time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/dashboard/dispense">
                <Sparkles className="h-4 w-4" /> Start dispensing
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
            >
              <Link href="/dashboard/inventory/create">
                <Plus className="h-4 w-4" /> Add medication
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {loading || !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} tone="teal" label="Patients" value={patients.length} hint={`${stats.activePrescriptions} active prescription${stats.activePrescriptions === 1 ? "" : "s"}`} href="/dashboard/user" />
          <StatCard icon={Boxes} tone="blue" label="Medications in stock" value={inventory.length - stats.outOfStock.length} hint={`${inventory.length} total products`} href="/dashboard/inventory" />
          <StatCard icon={AlertTriangle} tone="amber" label="Low stock" value={stats.lowStock.length} hint="At or below reorder level" href="/dashboard/inventory" />
          <StatCard icon={CalendarClock} tone="red" label="Expiring soon" value={stats.expiringSoon.length} hint="Within 30 days" href="/dashboard/inventory" />
          <StatCard icon={Banknote} tone="violet" label="Stock value" value={`₦${stats.stockValue.toLocaleString()}`} hint="Price × quantity on hand" />
        </div>
      )}

      {/* Two-column: needs attention + recent patients */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Needs attention</CardTitle>
              <CardDescription>Low stock and out-of-stock items</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/dashboard/inventory">
                View inventory <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading || !stats ? (
              <Skeleton className="h-40 w-full" />
            ) : stats.lowStock.length + stats.outOfStock.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                Everything is stocked above reorder levels. 🎉
              </div>
            ) : (
              <ul className="divide-y">
                {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map((m) => (
                  <li key={m._id} className="flex items-center justify-between py-2.5">
                    <Link
                      href={`/dashboard/inventory/${m._id}`}
                      className="min-w-0 text-sm font-medium hover:underline"
                    >
                      {m.nameOfDrugs}{" "}
                      <span className="font-normal text-muted-foreground">{m.dosage}</span>
                    </Link>
                    {m.quantityInStock <= 0 ? (
                      <Badge variant="destructive" className="shrink-0">Out of stock</Badge>
                    ) : (
                      <Badge className="shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                        {m.quantityInStock} left
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Recent patients</CardTitle>
              <CardDescription>Latest additions to your records</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/dashboard/user">
                All patients <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">No patients yet.</p>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/dashboard/user/create">
                    <Plus className="h-3.5 w-3.5" /> Add your first patient
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {[...patients].slice(-6).reverse().map((p) => (
                  <li key={p._id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {p.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/user/${p._id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {p.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.medications?.filter((m) => m.current).length || 0} active medication(s)
                      </p>
                    </div>
                    <span className="text-[11px] capitalize text-muted-foreground">{p.gender}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}