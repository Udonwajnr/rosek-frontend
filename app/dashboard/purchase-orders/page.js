"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "@/app/axios/axiosConfig";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ClipboardList, AlertTriangle } from "lucide-react";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "ordered", label: "Ordered" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export function StatusPill({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    ordered: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    received:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };
  const dot = {
    draft: "bg-slate-400",
    ordered: "bg-blue-500",
    received: "bg-emerald-500",
    cancelled: "bg-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[status] || styles.draft}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] || dot.draft}`} />
      {status}
    </span>
  );
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    if (!hid) return;
    api
      .get(`/api/purchase-order/${hid}`)
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]));
    api
      .get(`/api/purchase-order/${hid}/low-stock`)
      .then((res) => setLowStockCount((res.data || []).length))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Purchase orders</h1>
          <p className="text-sm text-muted-foreground">
            Order from suppliers and receive stock straight into batches
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/purchase-orders/create">
            <Plus className="h-4 w-4" /> New order
          </Link>
        </Button>
      </div>

      {/* Low-stock nudge */}
      {lowStockCount > 0 && (
        <Link
          href="/dashboard/purchase-orders/create?from=low-stock"
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{lowStockCount}</span> item
            {lowStockCount === 1 ? " is" : "s are"} at or below reorder level —
            start an order from them
          </span>
        </Link>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {orders === null ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {filter === "all"
                  ? "No purchase orders yet"
                  : `No ${filter} orders`}
              </p>
              {filter === "all" && (
                <p className="text-sm text-muted-foreground">
                  Create your first order to restock from a supplier.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">
                      Total
                    </th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o._id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/purchase-orders/${o._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{o.supplier?.name || "—"}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {o.items?.length || 0}
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                        {naira(
                          (o.items || []).reduce(
                            (s, i) => s + (i.costPrice || 0) * (i.quantityOrdered || 0),
                            0
                          )
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {shortDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={o.status} />
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
