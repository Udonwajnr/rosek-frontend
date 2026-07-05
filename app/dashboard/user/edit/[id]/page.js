"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Save,
  Search,
  Pill,
  X,
  Plus,
} from "lucide-react";

/*
 * Edit patient — two panels, same language as create-patient:
 *  left: patient details
 *  right: current medications (update qty/dates, mark for removal)
 *         + assign new medications from inventory
 *
 * Submits the exact payload updateUserInHospital expects:
 *  { fullName, dateOfBirth, gender, phoneNumber, email,
 *    medications: [{ _id, quantity, startDate, remove, ... }],
 *    newMedications: [{ medication, quantity, startDate, custom, ... }] }
 */

const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function EditPatient() {
  const router = useRouter();
  const { id } = useParams();
  const userId = id || "";

  const [hospitalId, setHospitalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
  });

  // Existing medications on the patient (from user.medications)
  const [existing, setExisting] = useState([]);
  // New medications to assign this save
  const [added, setAdded] = useState([]);

  const [medQuery, setMedQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (!hid || !userId) return;

    Promise.all([
      api.get(`/api/user/hospital/${hid}/users/${userId}`),
      api.get(`/api/medication/${hid}/medications`),
    ])
      .then(([userRes, invRes]) => {
        const u = userRes.data;
        setForm({
          fullName: u.fullName || "",
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
          gender: u.gender || "",
          phoneNumber: u.phoneNumber || "",
          email: u.email || "",
        });
        setExisting(
          (u.medications || []).map((m) => ({
            _id: m._id,
            med: m.medication, // populated
            quantity: m.quantity || 1,
            startDate: m.startDate ? m.startDate.slice(0, 10) : "",
            endDate: m.endDate ? m.endDate.slice(0, 10) : "",
            current: m.current,
            remove: false,
          }))
        );
        setInventory(invRes.data || []);
      })
      .catch(() => {
        toast.error("Could not load this patient");
        router.push("/dashboard/user");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Close picker on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickerResults = useMemo(() => {
    const q = medQuery.trim().toLowerCase();
    const chosenIds = new Set(added.map((a) => a.med._id));
    return inventory
      .filter((m) => !chosenIds.has(m._id))
      .filter(
        (m) =>
          !q ||
          m.nameOfDrugs?.toLowerCase().includes(q) ||
          m.barcode?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [inventory, medQuery, added]);

  const addMedication = (med) => {
    if ((med.quantityInStock || 0) <= 0) {
      toast.error(`${med.nameOfDrugs} is out of stock`);
      return;
    }
    setAdded((prev) => [
      ...prev,
      {
        med,
        quantity: 1,
        startDate: new Date().toISOString().slice(0, 10),
        custom: false,
        customDosage: "",
        customFrequency: { value: "", unit: "hours" },
        customDuration: { value: "", unit: "days" },
      },
    ]);
    setMedQuery("");
    setPickerOpen(false);
  };

  const updateAdded = (i, patch) =>
    setAdded((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAdded = (i) =>
    setAdded((prev) => prev.filter((_, idx) => idx !== i));

  const updateExisting = (i, patch) =>
    setExisting((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
    );

  const submit = async () => {
    if (!form.fullName.trim()) return toast.error("Full name is required");
    if (!form.gender) return toast.error("Gender is required");

    for (const a of added) {
      if (!a.quantity || a.quantity < 1)
        return toast.error(`Quantity for ${a.med.nameOfDrugs} must be at least 1`);
      if (a.quantity > (a.med.quantityInStock || 0))
        return toast.error(
          `Only ${a.med.quantityInStock} units of ${a.med.nameOfDrugs} in stock`
        );
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        medications: existing.map((m) => ({
          _id: m._id,
          quantity: Number(m.quantity) || 1,
          startDate: m.startDate || undefined,
          remove: m.remove,
        })),
      };

      if (added.length > 0) {
        payload.newMedications = added.map((a) => {
          const item = {
            medication: a.med._id,
            quantity: Number(a.quantity),
            startDate: a.startDate,
          };
          if (a.custom) {
            item.custom = true;
            if (a.customDosage) item.customDosage = Number(a.customDosage);
            if (a.customFrequency.value)
              item.customFrequency = {
                value: Number(a.customFrequency.value),
                unit: a.customFrequency.unit,
              };
            if (a.customDuration.value)
              item.customDuration = {
                value: Number(a.customDuration.value),
                unit: a.customDuration.unit,
              };
          }
          return item;
        });
      }

      await api.put(`/api/user/hospital/${hospitalId}/users/${userId}`, payload);
      toast.success("Patient updated");
      router.push(`/dashboard/user/${userId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  const removalCount = existing.filter((m) => m.remove).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/dashboard/user/${userId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Edit {form.fullName || "patient"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {existing.length} medication{existing.length === 1 ? "" : "s"} on file
              {added.length > 0 && ` · ${added.length} to assign`}
              {removalCount > 0 && ` · ${removalCount} marked for removal`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/user/${userId}`}>Cancel</Link>
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

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_420px]">
        {/* Left: patient details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Patient details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone</Label>
              <Input
                id="phoneNumber"
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: medications */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current medications</CardTitle>
              <CardDescription>
                Update quantities or mark for removal — changes apply on save
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {existing.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No medications on file for this patient.
                </p>
              ) : (
                existing.map((m, i) => (
                  <div
                    key={m._id}
                    className={`rounded-lg border p-3 transition-opacity ${
                      m.remove ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Pill className="h-4 w-4 text-primary" />
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${m.remove ? "line-through" : ""}`}>
                            {m.med?.nameOfDrugs || "(deleted drug)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.med?.dosage} · started {shortDate(m.startDate)} ·{" "}
                            {m.current ? "active" : "completed"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={m.remove ? "outline" : "ghost"}
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={() => updateExisting(i, { remove: !m.remove })}
                      >
                        {m.remove ? "Keep" : "Remove"}
                      </Button>
                    </div>
                    {!m.remove && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            className="h-8"
                            value={m.quantity}
                            onChange={(e) =>
                              updateExisting(i, { quantity: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Start date
                          </Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={m.startDate}
                            onChange={(e) =>
                              updateExisting(i, { startDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assign new medication</CardTitle>
              <CardDescription>
                Stock is dispensed FEFO and recorded in the ledger on save
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative" ref={pickerRef}>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search inventory by name or barcode…"
                  value={medQuery}
                  onFocus={() => setPickerOpen(true)}
                  onChange={(e) => {
                    setMedQuery(e.target.value);
                    setPickerOpen(true);
                  }}
                />
                {pickerOpen && pickerResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                    {pickerResults.map((m) => {
                      const out = (m.quantityInStock || 0) <= 0;
                      return (
                        <button
                          key={m._id}
                          type="button"
                          disabled={out}
                          onClick={() => addMedication(m)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {m.nameOfDrugs}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {m.dosage} · {m.dosageForm}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-xs ${out ? "text-red-500" : "text-muted-foreground"}`}
                          >
                            {out ? "Out of stock" : `${m.quantityInStock} in stock`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {added.map((a, i) => (
                <div key={a.med._id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Plus className="h-4 w-4 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {a.med.nameOfDrugs}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.med.dosage} · {a.med.quantityInStock} in stock
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeAdded(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        max={a.med.quantityInStock}
                        className="h-8"
                        value={a.quantity}
                        onChange={(e) => updateAdded(i, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Start date
                      </Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={a.startDate}
                        onChange={(e) => updateAdded(i, { startDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Label className="text-xs">Custom regimen</Label>
                    <Switch
                      checked={a.custom}
                      onCheckedChange={(v) => updateAdded(i, { custom: v })}
                    />
                  </div>

                  {a.custom && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Custom dosage
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-8"
                          value={a.customDosage}
                          onChange={(e) =>
                            updateAdded(i, { customDosage: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Frequency
                        </Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-16"
                            value={a.customFrequency.value}
                            onChange={(e) =>
                              updateAdded(i, {
                                customFrequency: {
                                  ...a.customFrequency,
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <Select
                            value={a.customFrequency.unit}
                            onValueChange={(v) =>
                              updateAdded(i, {
                                customFrequency: { ...a.customFrequency, unit: v },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hours">hrs</SelectItem>
                              <SelectItem value="days">days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Duration
                        </Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-16"
                            value={a.customDuration.value}
                            onChange={(e) =>
                              updateAdded(i, {
                                customDuration: {
                                  ...a.customDuration,
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <Select
                            value={a.customDuration.unit}
                            onValueChange={(v) =>
                              updateAdded(i, {
                                customDuration: { ...a.customDuration, unit: v },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">days</SelectItem>
                              <SelectItem value="weeks">weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
