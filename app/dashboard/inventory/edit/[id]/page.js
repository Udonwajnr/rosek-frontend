"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Loader2,
  Save,
  Layers,
  SlidersHorizontal,
  PackagePlus,
} from "lucide-react";

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Suppository",
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

function BatchStatusPill({ batch }) {
  const map = {
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    depleted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    expired: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    written_off: "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400",
  };
  const label = {
    active: "Active",
    depleted: "Depleted",
    expired: "Expired",
    written_off: "Written off",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[batch.status] || map.active}`}
    >
      {label[batch.status] || batch.status}
    </span>
  );
}

export default function EditMedication() {
  const router = useRouter();
  const { id } = useParams();
  const [hospitalId, setHospitalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState(null);
  const [stockNow, setStockNow] = useState(0);

  const [form, setForm] = useState(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjust, setAdjust] = useState({ quantityChange: "", type: "adjusted", reason: "" });
  const [adjusting, setAdjusting] = useState(false);

  const loadBatches = (hid) =>
    api
      .get(`/api/stock/${hid}/batches?medicationId=${id}`)
      .then((res) => setBatches(res.data || []))
      .catch(() => setBatches([]));

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (!hid || !id) return;

    Promise.all([
      api.get(`/api/medication/${hid}/medications/${id}`),
      api.get(`/api/supplier/${hid}?active=true`).catch(() => ({ data: [] })),
    ])
      .then(([medRes, supRes]) => {
        const m = medRes.data;
        setForm({
          nameOfDrugs: m.nameOfDrugs || "",
          dosage: m.dosage || "",
          dosageForm: m.dosageForm || "",
          dosageAmount: m.dosageAmount ?? "",
          frequency: {
            value: m.frequency?.value ?? "",
            unit: m.frequency?.unit || "hours",
          },
          duration: {
            value: m.duration?.value ?? "",
            unit: m.duration?.unit || "days",
          },
          numberOfUnits: m.numberOfUnits ?? "",
          notes: m.notes || "",
          barcode: m.barcode || "",
          preferredSupplier: m.preferredSupplier?._id || m.preferredSupplier || "",
          price: m.price ?? "",
          expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : "",
          reorderLevel: m.reorderLevel ?? 10,
        });
        setStockNow(m.quantityInStock || 0);
        setSuppliers(supRes.data || []);
      })
      .catch(() => {
        toast.error("Could not load this medication");
        router.push("/dashboard/inventory");
      })
      .finally(() => setLoading(false));

    loadBatches(hid);
  }, [id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setNested = (key, sub, value) =>
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [sub]: value } }));

  const submit = async () => {
    if (!form.nameOfDrugs.trim()) return toast.error("Drug name is required");
    if (!form.dosage.trim()) return toast.error("Dosage is required");
    if (form.price === "") return toast.error("Selling price is required");

    setSaving(true);
    try {
      await api.put(`/api/medication/${hospitalId}/medications/${id}`, {
        nameOfDrugs: form.nameOfDrugs.trim(),
        dosage: form.dosage.trim(),
        dosageForm: form.dosageForm,
        dosageAmount: Number(form.dosageAmount),
        frequency: { value: Number(form.frequency.value), unit: form.frequency.unit },
        duration: { value: Number(form.duration.value), unit: form.duration.unit },
        numberOfUnits: Number(form.numberOfUnits),
        notes: form.notes.trim(),
        barcode: form.barcode.trim(),
        preferredSupplier: form.preferredSupplier || null,
        price: Number(form.price),
        expiryDate: form.expiryDate,
        reorderLevel: Number(form.reorderLevel) || 10,
      });
      toast.success("Medication updated");
      router.push("/dashboard/inventory");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitAdjustment = async () => {
    const change = Number(adjust.quantityChange);
    if (!change) return toast.error("Enter a non-zero quantity (use - to remove stock)");
    if (!adjust.reason.trim()) return toast.error("A reason is required for every adjustment");
    setAdjusting(true);
    try {
      const res = await api.post(`/api/stock/${hospitalId}/adjust`, {
        medicationId: id,
        quantityChange: change,
        type: adjust.type,
        reason: adjust.reason.trim(),
      });
      setStockNow(res.data.medication.quantityInStock);
      toast.success(`Stock ${change > 0 ? "increased" : "reduced"} by ${Math.abs(change)}`);
      setAdjustOpen(false);
      setAdjust({ quantityChange: "", type: "adjusted", reason: "" });
      loadBatches(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[480px]" />
          <Skeleton className="h-[480px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-24 sm:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Edit {form.nameOfDrugs}
            </h1>
            <p className="text-sm text-muted-foreground">
              {form.dosage} · {form.dosageForm || "—"}
            </p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory">Cancel</Link>
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        {/* Left: product details */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Product</CardTitle>
              <CardDescription>What this medication is</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nameOfDrugs">Drug name</Label>
                <Input
                  id="nameOfDrugs"
                  value={form.nameOfDrugs}
                  onChange={(e) => set("nameOfDrugs", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dosage">Strength / dosage</Label>
                <Input
                  id="dosage"
                  placeholder="500mg"
                  value={form.dosage}
                  onChange={(e) => set("dosage", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Dosage form</Label>
                <Select
                  value={form.dosageForm}
                  onValueChange={(v) => set("dosageForm", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSAGE_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="barcode">Barcode / NAFDAC no.</Label>
                <Input
                  id="barcode"
                  placeholder="Optional"
                  value={form.barcode}
                  onChange={(e) => set("barcode", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred supplier</Label>
                <Select
                  value={form.preferredSupplier || "none"}
                  onValueChange={(v) => set("preferredSupplier", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Default regimen</CardTitle>
              <CardDescription>
                Used when assigning this drug to a patient
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dosageAmount">Units per intake</Label>
                <Input
                  id="dosageAmount"
                  type="number"
                  min="0"
                  value={form.dosageAmount}
                  onChange={(e) => set("dosageAmount", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numberOfUnits">Units per pack</Label>
                <Input
                  id="numberOfUnits"
                  type="number"
                  min="0"
                  value={form.numberOfUnits}
                  onChange={(e) => set("numberOfUnits", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    className="w-24"
                    value={form.frequency.value}
                    onChange={(e) => setNested("frequency", "value", e.target.value)}
                  />
                  <Select
                    value={form.frequency.unit}
                    onValueChange={(v) => setNested("frequency", "unit", v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Every N hours</SelectItem>
                      <SelectItem value="days">Every N days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    className="w-24"
                    value={form.duration.value}
                    onChange={(e) => setNested("duration", "value", e.target.value)}
                  />
                  <Select
                    value={form.duration.unit}
                    onValueChange={(v) => setNested("duration", "unit", v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Storage instructions, warnings…"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Pricing & reorder</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Selling price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reorderLevel">Reorder level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) => set("reorderLevel", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Earliest expiry</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => set("expiryDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: stock & batches */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-primary" /> Stock on hand
              </CardTitle>
              <CardDescription>
                Stock changes are recorded in the ledger — receive or adjust, don't
                overwrite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold tabular-nums">
                {stockNow.toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">units</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  <Link href={`/dashboard/stock?receive=${id}`}>
                    <PackagePlus className="h-3.5 w-3.5" /> Receive stock
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setAdjustOpen(true)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Batches</CardTitle>
              <CardDescription>Dispensing uses earliest expiry first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {batches === null ? (
                <>
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </>
              ) : batches.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No batches yet. Receive stock to start batch tracking for this
                  drug.
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
                        Exp {shortDate(b.expiryDate)} · {naira(b.costPrice)}/unit
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {b.quantityRemaining}/{b.quantityReceived}
                      </span>
                      <BatchStatusPill batch={b} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Adjust stock sheet */}
      <Sheet open={adjustOpen} onOpenChange={setAdjustOpen}>
        <SheetContent className="flex w-full flex-col gap-5 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adjust stock</SheetTitle>
            <SheetDescription>
              For counts, damage, or returns. Every adjustment is recorded in the
              ledger with your reason.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Quantity change</Label>
              <Input
                type="number"
                placeholder="e.g. -5 removes 5 units, 10 adds 10"
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
            <div className="space-y-1.5">
              <Label>Reason (required)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Physical count on 4 Jul found 5 fewer packs"
                value={adjust.reason}
                onChange={(e) =>
                  setAdjust((p) => ({ ...p, reason: e.target.value }))
                }
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdjustment} disabled={adjusting} className="gap-2">
              {adjusting && <Loader2 className="h-4 w-4 animate-spin" />}
              Record adjustment
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3 sm:hidden">
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/inventory">Cancel</Link>
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}