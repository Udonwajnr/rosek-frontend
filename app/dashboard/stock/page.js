"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  PackagePlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TYPE_META = {
  received: { label: "Received", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-500" },
  dispensed: { label: "Dispensed", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", dot: "bg-blue-500" },
  adjusted: { label: "Adjusted", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300", dot: "bg-violet-500" },
  expired: { label: "Expired", cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300", dot: "bg-red-500" },
  damaged: { label: "Damaged", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-500" },
  returned: { label: "Returned", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", dot: "bg-slate-400" },
};

const dateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function StockLedgerInner() {
  const searchParams = useSearchParams();
  const receiveTarget = searchParams.get("receive"); // medicationId to pre-open receive sheet

  const [hospitalId, setHospitalId] = useState("");
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [movements, setMovements] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [medFilter, setMedFilter] = useState("all");

  // Receive sheet
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receive, setReceive] = useState({
    medicationId: "",
    supplierId: "",
    batchNumber: "",
    quantity: "",
    costPrice: "",
    expiryDate: "",
    notes: "",
  });
  const [receiving, setReceiving] = useState(false);

  // Adjust sheet
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjust, setAdjust] = useState({
    medicationId: "",
    quantityChange: "",
    type: "adjusted",
    reason: "",
  });
  const [adjusting, setAdjusting] = useState(false);

  const loadMovements = (hid, p = 1, type = typeFilter, med = medFilter) => {
    const params = new URLSearchParams({ page: p, limit: 25 });
    if (type !== "all") params.set("type", type);
    if (med !== "all") params.set("medicationId", med);
    api
      .get(`/api/stock/${hid}/movements?${params.toString()}`)
      .then((res) => {
        setMovements(res.data.movements || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      })
      .catch(() => setMovements([]));
  };

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (!hid) return;
    loadMovements(hid);
    api
      .get(`/api/medication/${hid}/medications`)
      .then((res) => setInventory(res.data || []))
      .catch(() => {});
    api
      .get(`/api/supplier/${hid}?active=true`)
      .then((res) => setSuppliers(res.data || []))
      .catch(() => {});
  }, []);

  // Pre-open receive sheet when arriving from an inventory edit page
  useEffect(() => {
    if (receiveTarget) {
      setReceive((p) => ({ ...p, medicationId: receiveTarget }));
      setReceiveOpen(true);
    }
  }, [receiveTarget]);

  const changeFilter = (type, med) => {
    setTypeFilter(type);
    setMedFilter(med);
    setMovements(null);
    loadMovements(hospitalId, 1, type, med);
  };

  const goToPage = (p) => {
    setMovements(null);
    loadMovements(hospitalId, p);
  };

  const submitReceive = async () => {
    if (!receive.medicationId) return toast.error("Choose a medication");
    if (!receive.batchNumber.trim()) return toast.error("Batch number is required");
    if (!receive.quantity || Number(receive.quantity) < 1)
      return toast.error("Quantity must be at least 1");
    if (!receive.expiryDate) return toast.error("Expiry date is required");

    setReceiving(true);
    try {
      await api.post(`/api/stock/${hospitalId}/receive`, {
        medicationId: receive.medicationId,
        supplierId: receive.supplierId || undefined,
        batchNumber: receive.batchNumber.trim(),
        quantity: Number(receive.quantity),
        costPrice: Number(receive.costPrice) || 0,
        expiryDate: receive.expiryDate,
        notes: receive.notes.trim() || undefined,
      });
      toast.success("Stock received into a new batch");
      setReceiveOpen(false);
      setReceive({
        medicationId: "",
        supplierId: "",
        batchNumber: "",
        quantity: "",
        costPrice: "",
        expiryDate: "",
        notes: "",
      });
      loadMovements(hospitalId, 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not receive stock");
    } finally {
      setReceiving(false);
    }
  };

  const submitAdjust = async () => {
    if (!adjust.medicationId) return toast.error("Choose a medication");
    const change = Number(adjust.quantityChange);
    if (!change) return toast.error("Enter a non-zero quantity (use - to remove)");
    if (!adjust.reason.trim()) return toast.error("A reason is required");

    setAdjusting(true);
    try {
      await api.post(`/api/stock/${hospitalId}/adjust`, {
        medicationId: adjust.medicationId,
        quantityChange: change,
        type: adjust.type,
        reason: adjust.reason.trim(),
      });
      toast.success("Adjustment recorded");
      setAdjustOpen(false);
      setAdjust({ medicationId: "", quantityChange: "", type: "adjusted", reason: "" });
      loadMovements(hospitalId, 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  };

  const medOptions = useMemo(
    () =>
      [...inventory].sort((a, b) =>
        (a.nameOfDrugs || "").localeCompare(b.nameOfDrugs || "")
      ),
    [inventory]
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Stock ledger</h1>
          <p className="text-sm text-muted-foreground">
            Every stock change, recorded and explainable — nothing edits history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAdjustOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Adjust
          </Button>
          <Button className="gap-2" onClick={() => setReceiveOpen(true)}>
            <PackagePlus className="h-4 w-4" /> Receive stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={(v) => changeFilter(v, medFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All movements</SelectItem>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={medFilter} onValueChange={(v) => changeFilter(typeFilter, v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All medications</SelectItem>
            {medOptions.map((m) => (
              <SelectItem key={m._id} value={m._id}>
                {m.nameOfDrugs} {m.dosage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger table */}
      <Card>
        <CardContent className="p-0">
          {movements === null ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No movements yet</p>
              <p className="text-sm text-muted-foreground">
                Receive stock, dispense to a patient, or make an adjustment — every
                change lands here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Medication</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Change</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">
                      Batch
                    </th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const meta = TYPE_META[m.type] || TYPE_META.adjusted;
                    const positive = m.quantityChange > 0;
                    return (
                      <tr key={m._id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {dateTime(m.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {m.medication?.nameOfDrugs || "(deleted)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.medication?.dosage}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold tabular-nums ${
                            positive ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {positive ? (
                              <ArrowDownToLine className="h-3 w-3" />
                            ) : (
                              <ArrowUpFromLine className="h-3 w-3" />
                            )}
                            {positive ? "+" : ""}
                            {m.quantityChange}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {m.balanceAfter}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                          {m.batch?.batchNumber || "—"}
                        </td>
                        <td className="hidden max-w-[260px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                          {m.reason || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page >= pages}
            onClick={() => goToPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Receive stock sheet */}
      <Sheet open={receiveOpen} onOpenChange={setReceiveOpen}>
        <SheetContent className="flex w-full flex-col gap-5 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Receive stock</SheetTitle>
            <SheetDescription>
              Creates a new batch and adds its quantity to inventory
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Medication</Label>
              <Select
                value={receive.medicationId}
                onValueChange={(v) => setReceive((p) => ({ ...p, medicationId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a drug" />
                </SelectTrigger>
                <SelectContent>
                  {medOptions.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.nameOfDrugs} {m.dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select
                value={receive.supplierId || "none"}
                onValueChange={(v) =>
                  setReceive((p) => ({ ...p, supplierId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Batch number</Label>
                <Input
                  placeholder="e.g. AMX-0426"
                  value={receive.batchNumber}
                  onChange={(e) =>
                    setReceive((p) => ({ ...p, batchNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={receive.quantity}
                  onChange={(e) =>
                    setReceive((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cost / unit (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  value={receive.costPrice}
                  onChange={(e) =>
                    setReceive((p) => ({ ...p, costPrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={receive.expiryDate}
                  onChange={(e) =>
                    setReceive((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder="Invoice number, delivery note…"
                value={receive.notes}
                onChange={(e) => setReceive((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReceive} disabled={receiving} className="gap-2">
              {receiving && <Loader2 className="h-4 w-4 animate-spin" />}
              Receive into batch
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Adjust stock sheet */}
      <Sheet open={adjustOpen} onOpenChange={setAdjustOpen}>
        <SheetContent className="flex w-full flex-col gap-5 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adjust stock</SheetTitle>
            <SheetDescription>
              For counts, damage, or returns — the reason goes on the record
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Medication</Label>
              <Select
                value={adjust.medicationId}
                onValueChange={(v) => setAdjust((p) => ({ ...p, medicationId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a drug" />
                </SelectTrigger>
                <SelectContent>
                  {medOptions.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.nameOfDrugs} {m.dosage} · {m.quantityInStock} in stock
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity change</Label>
                <Input
                  type="number"
                  placeholder="-5 or 10"
                  value={adjust.quantityChange}
                  onChange={(e) =>
                    setAdjust((p) => ({ ...p, quantityChange: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={adjust.type}
                  onValueChange={(v) => setAdjust((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjusted">Count correction</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (required)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Physical count found 5 fewer packs"
                value={adjust.reason}
                onChange={(e) => setAdjust((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdjust} disabled={adjusting} className="gap-2">
              {adjusting && <Loader2 className="h-4 w-4 animate-spin" />}
              Record adjustment
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function StockLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-[420px]" />
        </div>
      }
    >
      <StockLedgerInner />
    </Suspense>
  );
}
