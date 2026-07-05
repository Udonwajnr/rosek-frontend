"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Pencil,
  PackagePlus,
  Boxes,
  Wallet,
  Bell,
  CalendarClock,
  Barcode,
  Truck,
  Pill,
  Layers,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const dateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const daysUntil = (d) =>
  Math.ceil((new Date(d) - new Date()) / (24 * 60 * 60 * 1000));

function StockPill({ product }) {
  const qty = product.quantityInStock || 0;
  const low = qty > 0 && qty <= (product.reorderLevel || 10);
  if (qty <= 0)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Out of stock
      </span>
    );
  if (low)
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

function BatchStatusPill({ status }) {
  const map = {
    active:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    depleted:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    expired: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    written_off:
      "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400",
  };
  const label = {
    active: "Active",
    depleted: "Depleted",
    expired: "Expired",
    written_off: "Written off",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status] || map.active}`}
    >
      {label[status] || status}
    </span>
  );
}

const MOVE_META = {
  received: { cls: "text-emerald-600", icon: ArrowDownToLine },
  dispensed: { cls: "text-blue-600", icon: ArrowUpFromLine },
  adjusted: { cls: "text-violet-600", icon: ArrowLeftRight },
  expired: { cls: "text-red-500", icon: ArrowUpFromLine },
  damaged: { cls: "text-amber-600", icon: ArrowUpFromLine },
  returned: { cls: "text-slate-500", icon: ArrowDownToLine },
};

function Stat({ icon: Icon, label, value, sub, tone = "" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`truncate text-lg font-bold tabular-nums ${tone}`}>
            {value}
          </p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default function MedicationDetails() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState(null);
  const [movements, setMovements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hospitalId = localStorage.getItem("_id");
    if (!hospitalId || !id) return;

    api
      .get(`/api/medication/${hospitalId}/medications/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Could not load this medication"))
      .finally(() => setLoading(false));

    api
      .get(`/api/stock/${hospitalId}/batches?medicationId=${id}`)
      .then((res) => setBatches(res.data || []))
      .catch(() => setBatches([]));

    api
      .get(`/api/stock/${hospitalId}/movements?medicationId=${id}&limit=8`)
      .then((res) => setMovements(res.data.movements || []))
      .catch(() => setMovements([]));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-16 text-center">
        <Pill className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">{error || "Medication not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/inventory">Back to inventory</Link>
        </Button>
      </div>
    );
  }

  const qty = product.quantityInStock || 0;
  const expDays = product.expiryDate ? daysUntil(product.expiryDate) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {product.nameOfDrugs}
              </h1>
              <StockPill product={product} />
            </div>
            <p className="text-sm text-muted-foreground">
              {product.dosage} · {product.dosageForm}
              {product.barcode && ` · ${product.barcode}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/dashboard/stock?receive=${id}`}>
              <PackagePlus className="h-4 w-4" /> Receive stock
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/dashboard/inventory/edit/${id}`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Boxes}
          label="In stock"
          value={qty.toLocaleString()}
          sub={`Reorder at ${product.reorderLevel || 10}`}
          tone={
            qty <= 0
              ? "text-red-500"
              : qty <= (product.reorderLevel || 10)
                ? "text-amber-600"
                : ""
          }
        />
        <Stat
          icon={Wallet}
          label="Selling price"
          value={naira(product.price)}
        />
        <Stat
          icon={Wallet}
          label="Value on hand"
          value={naira(qty * (product.price || 0))}
        />
        <Stat
          icon={CalendarClock}
          label="Earliest expiry"
          value={shortDate(product.expiryDate)}
          sub={
            expDays !== null
              ? expDays < 0
                ? `${Math.abs(expDays)} days ago`
                : `in ${expDays} days`
              : undefined
          }
          tone={
            expDays !== null && expDays < 0
              ? "text-red-500"
              : expDays !== null && expDays <= 30
                ? "text-amber-600"
                : ""
          }
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Default regimen</CardTitle>
              <CardDescription>
                Applied when this drug is assigned to a patient
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow
                label="Dose per intake"
                value={`${product.dosageAmount ?? "—"} unit${product.dosageAmount === 1 ? "" : "s"}`}
              />
              <InfoRow
                label="Frequency"
                value={
                  product.frequency
                    ? `Every ${product.frequency.value} ${product.frequency.unit}`
                    : "—"
                }
              />
              <InfoRow
                label="Duration"
                value={
                  product.duration
                    ? `${product.duration.value} ${product.duration.unit}`
                    : "—"
                }
              />
              <InfoRow
                label="Units per pack"
                value={product.numberOfUnits ?? "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Product details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5" /> Barcode
                  </span>
                }
                value={product.barcode || "—"}
              />
              <InfoRow
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Preferred supplier
                  </span>
                }
                value={product.preferredSupplier?.name || "—"}
              />
              <InfoRow
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5" /> Assigned patients
                  </span>
                }
                value={product.user?.length || 0}
              />
              <InfoRow label="Added" value={shortDate(product.createdAt)} />
            </CardContent>
          </Card>

          {product.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-primary" /> Batches
              </CardTitle>
              <CardDescription>
                Dispensing uses earliest expiry first
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {batches === null ? (
                <>
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </>
              ) : batches.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No batches yet — receive stock to start batch tracking.
                </p>
              ) : (
                batches.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.batchNumber}
                        {b.supplier?.name && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {b.supplier.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Exp {shortDate(b.expiryDate)} · {naira(b.costPrice)}
                        /unit
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {b.quantityRemaining}/{b.quantityReceived}
                      </span>
                      <BatchStatusPill status={b.status} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowLeftRight className="h-4 w-4 text-primary" /> Recent
                movements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {movements === null ? (
                <>
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </>
              ) : movements.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No movements recorded for this drug yet.
                </p>
              ) : (
                <>
                  {movements.map((m) => {
                    const meta = MOVE_META[m.type] || MOVE_META.adjusted;
                    const Icon = meta.icon;
                    const positive = m.quantityChange > 0;
                    return (
                      <div
                        key={m._id}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon className={`h-4 w-4 shrink-0 ${meta.cls}`} />
                          <div className="min-w-0">
                            <p className="truncate text-sm capitalize">
                              {m.type}
                              {m.batch?.batchNumber && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {m.batch.batchNumber}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dateTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            positive ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {m.quantityChange}
                        </span>
                      </div>
                    );
                  })}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-primary"
                  >
                    <Link href="/dashboard/stock">View full ledger</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
