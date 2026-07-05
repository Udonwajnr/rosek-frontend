"use client";
import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Search,
  X,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

function CreateOrderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLowStock = searchParams.get("from") === "low-stock";

  const [hospitalId, setHospitalId] = useState("");
  const [suppliers, setSuppliers] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([]); // { med, quantityOrdered, costPrice }
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [medQuery, setMedQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (!hid) return;

    Promise.all([
      api.get(`/api/supplier/${hid}?active=true`),
      api.get(`/api/medication/${hid}/medications`),
      api.get(`/api/purchase-order/${hid}/low-stock`),
    ])
      .then(([supRes, invRes, lowRes]) => {
        setSuppliers(supRes.data || []);
        setInventory(invRes.data || []);
        setLowStock(lowRes.data || []);
        if (fromLowStock && (lowRes.data || []).length > 0) {
          setItems(
            lowRes.data.map((m) => ({
              med: m,
              quantityOrdered: Math.max(
                (m.reorderLevel || 10) * 2 - (m.quantityInStock || 0),
                1
              ),
              costPrice: "",
            }))
          );
        }
      })
      .catch(() => {
        setSuppliers([]);
      });
  }, [fromLowStock]);

  useEffect(() => {
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pickerResults = useMemo(() => {
    const q = medQuery.trim().toLowerCase();
    const chosen = new Set(items.map((i) => i.med._id));
    return inventory
      .filter((m) => !chosen.has(m._id))
      .filter(
        (m) =>
          !q ||
          m.nameOfDrugs?.toLowerCase().includes(q) ||
          m.barcode?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [inventory, medQuery, items]);

  const addItem = (med) => {
    setItems((prev) => [...prev, { med, quantityOrdered: "", costPrice: "" }]);
    setMedQuery("");
    setPickerOpen(false);
  };

  const updateItem = (i, patch) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const total = items.reduce(
    (s, i) => s + (Number(i.costPrice) || 0) * (Number(i.quantityOrdered) || 0),
    0
  );

  const submit = async (status) => {
    if (!supplierId) return toast.error("Choose a supplier");
    if (items.length === 0) return toast.error("Add at least one item");
    for (const i of items) {
      if (!i.quantityOrdered || Number(i.quantityOrdered) < 1)
        return toast.error(`Quantity for ${i.med.nameOfDrugs} must be at least 1`);
    }

    setSaving(true);
    try {
      const res = await api.post(`/api/purchase-order/${hospitalId}`, {
        supplierId,
        items: items.map((i) => ({
          medication: i.med._id,
          quantityOrdered: Number(i.quantityOrdered),
          costPrice: Number(i.costPrice) || 0,
        })),
        notes,
        expectedDate: expectedDate || undefined,
        status,
      });
      toast.success(
        `${res.data.orderNumber} ${status === "ordered" ? "placed" : "saved as draft"}`
      );
      router.push(`/dashboard/purchase-orders/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create the order");
    } finally {
      setSaving(false);
    }
  };

  if (suppliers === null) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              New purchase order
            </h1>
            <p className="text-sm text-muted-foreground">
              {fromLowStock
                ? "Pre-filled from your low-stock items"
                : "Order stock from a supplier"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => submit("draft")}
          >
            Save as draft
          </Button>
          <Button disabled={saving} onClick={() => submit("ordered")} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Place order
          </Button>
        </div>
      </div>

      {suppliers.length === 0 && (
        <Link
          href="/dashboard/suppliers"
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          You have no active suppliers yet — add one first.
        </Link>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Items</CardTitle>
            <CardDescription>
              What you're ordering and at what cost per unit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative" ref={pickerRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search inventory to add items…"
                value={medQuery}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setMedQuery(e.target.value);
                  setPickerOpen(true);
                }}
              />
              {pickerOpen && pickerResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                  {pickerResults.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => addItem(m)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {m.nameOfDrugs}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {m.dosage} · {m.dosageForm}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {m.quantityInStock} in stock
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No items yet. Search above to add medications to this order.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((i, idx) => {
                  const low = lowStock.some((l) => l._id === i.med._id);
                  return (
                    <div key={i.med._id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {i.med.nameOfDrugs}{" "}
                            {low && (
                              <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                Low stock
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {i.med.dosage} · {i.med.quantityInStock} in stock ·
                            reorder at {i.med.reorderLevel || 10}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeItem(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            className="h-8"
                            value={i.quantityOrdered}
                            onChange={(e) =>
                              updateItem(idx, { quantityOrdered: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Cost / unit (₦)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8"
                            value={i.costPrice}
                            onChange={(e) =>
                              updateItem(idx, { costPrice: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                          <p className="text-sm font-semibold tabular-nums">
                            {naira(
                              (Number(i.costPrice) || 0) *
                                (Number(i.quantityOrdered) || 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" /> Order details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected">Expected delivery</Label>
              <Input
                id="expected"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea
                id="po-notes"
                rows={3}
                placeholder="Delivery instructions, invoice reference…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
              <span className="text-sm text-muted-foreground">Order total</span>
              <span className="text-base font-bold tabular-nums">{naira(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreatePurchaseOrder() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-[420px]" />
        </div>
      }
    >
      <CreateOrderInner />
    </Suspense>
  );
}
