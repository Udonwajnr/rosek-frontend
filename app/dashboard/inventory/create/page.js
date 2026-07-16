"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Loader2, Pill, PackagePlus, ScanBarcode } from "lucide-react";

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

function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function CreateMedication() {
  const router = useRouter();
  const [hospitalId, setHospitalId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nameOfDrugs: "",
    dosage: "",
    dosageForm: "",
    dosageAmount: "",
    frequency: { value: "", unit: "hours" },
    duration: { value: "", unit: "days" },
    numberOfUnits: "",
    notes: "",
    quantityInStock: "",
    barcode: "",
    preferredSupplier: "",
    price: "",
    expiryDate: "",
    reorderLevel: "10",
  });

  useEffect(() => {
    const id = localStorage.getItem("_id");
    setHospitalId(id);
    if (!id) return;
    api
      .get(`/api/supplier/${id}?active=true`)
      .then((res) => setSuppliers(res.data || []))
      .catch(() => setSuppliers([]));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setNested = (key, sub, value) =>
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [sub]: value } }));

  const missing = () => {
    if (!form.nameOfDrugs.trim()) return "Drug name is required";
    if (!form.dosage.trim()) return "Dosage is required";
    if (!form.dosageForm) return "Dosage form is required";
    if (!form.dosageAmount) return "Dosage amount is required";
    if (!form.frequency.value) return "Frequency is required";
    if (!form.duration.value) return "Duration is required";
    if (!form.numberOfUnits) return "Units per pack is required";
    if (form.quantityInStock === "") return "Opening stock is required";
    if (form.price === "") return "Selling price is required";
    if (!form.expiryDate) return "Expiry date is required";
    return null;
  };

  const submit = async () => {
    const problem = missing();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameOfDrugs: form.nameOfDrugs.trim(),
        dosage: form.dosage.trim(),
        dosageForm: form.dosageForm,
        dosageAmount: Number(form.dosageAmount),
        frequency: {
          value: Number(form.frequency.value),
          unit: form.frequency.unit,
        },
        duration: {
          value: Number(form.duration.value),
          unit: form.duration.unit,
        },
        numberOfUnits: Number(form.numberOfUnits),
        notes: form.notes.trim(),
        quantityInStock: Number(form.quantityInStock),
        barcode: form.barcode.trim(),
        preferredSupplier: form.preferredSupplier || undefined,
        price: Number(form.price),
        expiryDate: form.expiryDate,
        reorderLevel: Number(form.reorderLevel) || 10,
      };
      await api.post(`/api/medication/${hospitalId}/medications`, payload);
      toast.success(`${payload.nameOfDrugs} added to inventory`);
      router.push("/dashboard/inventory");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not add the medication. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-24 sm:pb-0">
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
              Add medication
            </h1>
            <p className="text-sm text-muted-foreground">
              New product for your inventory
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
              <PackagePlus className="h-4 w-4" />
            )}
            Add medication
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: drug identity + regimen */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="h-4 w-4 text-primary" /> Drug details
              </CardTitle>
              <CardDescription>What the medication is</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Drug name" required>
                  <Input
                    placeholder="e.g. Amoxicillin"
                    value={form.nameOfDrugs}
                    onChange={(e) => set("nameOfDrugs", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Dosage strength" required>
                <Input
                  placeholder="e.g. 500mg"
                  value={form.dosage}
                  onChange={(e) => set("dosage", e.target.value)}
                />
              </Field>
              <Field label="Dosage form" required>
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
              </Field>
              <Field label="Units per pack" hint="Tablets or doses in one pack" required>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={form.numberOfUnits}
                  onChange={(e) => set("numberOfUnits", e.target.value)}
                />
              </Field>
              <Field label="Barcode / NAFDAC number" hint="Used by inventory search">
                <div className="relative">
                  <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="e.g. A4-0163"
                    value={form.barcode}
                    onChange={(e) => set("barcode", e.target.value)}
                  />
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Default regimen</CardTitle>
              <CardDescription>
                Applied when this drug is assigned to a patient (can be
                overridden per patient)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Dose per intake" required>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={form.dosageAmount}
                  onChange={(e) => set("dosageAmount", e.target.value)}
                />
              </Field>
              <Field label="Frequency" required>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 8"
                    value={form.frequency.value}
                    onChange={(e) =>
                      setNested("frequency", "value", e.target.value)
                    }
                  />
                  <Select
                    value={form.frequency.unit}
                    onValueChange={(v) => setNested("frequency", "unit", v)}
                  >
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">hours</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label="Duration" required>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 7"
                    value={form.duration.value}
                    onChange={(e) =>
                      setNested("duration", "value", e.target.value)
                    }
                  />
                  <Select
                    value={form.duration.unit}
                    onValueChange={(v) => setNested("duration", "unit", v)}
                  >
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">days</SelectItem>
                      <SelectItem value="weeks">weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <div className="sm:col-span-3">
                <Field label="Notes">
                  <Textarea
                    rows={3}
                    placeholder="e.g. Take with food. Avoid alcohol."
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: stock, pricing, supplier */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Stock &amp; pricing</CardTitle>
              <CardDescription>Opening stock and shelf details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field
                label="Opening stock"
                hint="Future deliveries should be received as batches from Stock ledger or a purchase order"
                required
              >
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 200"
                  value={form.quantityInStock}
                  onChange={(e) => set("quantityInStock", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Selling price (₦)" required>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </Field>
                <Field label="Reorder level" hint="Low-stock alert threshold">
                  <Input
                    type="number"
                    min="0"
                    value={form.reorderLevel}
                    onChange={(e) => set("reorderLevel", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Expiry date" required>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => set("expiryDate", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Supplier</CardTitle>
              <CardDescription>
                Preferred supplier for reordering this drug
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Select
                value={form.preferredSupplier}
                onValueChange={(v) =>
                  set("preferredSupplier", v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preferred supplier</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliers.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No suppliers yet —{" "}
                  <Link
                    href="/dashboard/suppliers"
                    className="font-medium text-primary hover:underline"
                  >
                    add one
                  </Link>{" "}
                  to enable purchase orders and batch traceability.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3 sm:hidden">
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/inventory">Cancel</Link>
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            Add medication
          </Button>
        </div>
      </div>
    </div>
  );
}