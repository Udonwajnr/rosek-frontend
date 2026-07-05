"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "../../axios/axiosConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Boxes,
  AlertTriangle,
  PackageX,
  Pill,
} from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "in", label: "In stock" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
];

function stockStatus(m) {
  const qty = m.quantityInStock || 0;
  if (qty <= 0) return "out";
  if (qty <= (m.reorderLevel || 10)) return "low";
  return "in";
}

function StatusPill({ status }) {
  if (status === "out")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Out of stock
      </span>
    );
  if (status === "low")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Low stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> In stock
    </span>
  );
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const hospitalId = localStorage.getItem("_id");
    if (!hospitalId) return;
    api
      .get(`/api/medication/${hospitalId}/medications`)
      .then((res) => setInventory(res.data || []))
      .catch(() => setInventory([]));
  }, []);

  const counts = useMemo(() => {
    if (!inventory) return { in: 0, low: 0, out: 0, value: 0 };
    return {
      in: inventory.filter((m) => stockStatus(m) === "in").length,
      low: inventory.filter((m) => stockStatus(m) === "low").length,
      out: inventory.filter((m) => stockStatus(m) === "out").length,
      value: inventory.reduce(
        (s, m) => s + (m.price || 0) * (m.quantityInStock || 0),
        0,
      ),
    };
  }, [inventory]);

  const rows = useMemo(() => {
    if (!inventory) return [];
    const q = query.trim().toLowerCase();
    return inventory.filter((m) => {
      if (filter !== "all" && stockStatus(m) !== filter) return false;
      if (q && !m.nameOfDrugs?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inventory, query, filter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {inventory ? (
              <>
                {inventory.length} products · stock value{" "}
                <span className="font-medium text-foreground">
                  ₦{counts.value.toLocaleString()}
                </span>
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/inventory/create">
            <Plus className="h-4 w-4" /> Add medication
          </Link>
        </Button>
      </div>

      {/* Stock summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Boxes,
            label: "In stock",
            value: counts.in,
            cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            icon: AlertTriangle,
            label: "Low stock",
            value: counts.low,
            cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            icon: PackageX,
            label: "Out of stock",
            value: counts.out,
            cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.cls}`}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tabular-nums">
                  {inventory ? s.value : "–"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medications…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? "secondary" : "ghost"}
                  className="text-xs"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          {!inventory ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Pill className="h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {query || filter !== "all"
                  ? "No medications match your search."
                  : "Your inventory is empty."}
              </p>
              {!query && filter === "all" && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/dashboard/inventory/create">
                    <Plus className="h-3.5 w-3.5" /> Add your first medication
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rosek-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Form</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Expiry</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((m) => (
                    <tr
                      key={m._id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/inventory/${m._id}`}
                          className="font-medium hover:underline"
                        >
                          {m.nameOfDrugs}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {m.dosage}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.dosageForm || "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        ₦{(m.price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {m.quantityInStock ?? 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.expiryDate
                          ? new Date(m.expiryDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={stockStatus(m)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${m.nameOfDrugs}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/inventory/${m._id}`}>
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/inventory/edit/${m._id}`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/inventory/${m._id}/delete`}
                                className="text-destructive"
                              >
                                Delete
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
