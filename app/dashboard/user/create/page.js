"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, X, Pill, Loader2, UserPlus } from "lucide-react";

export default function CreatePatient() {
  const router = useRouter();
  const [hospitalId, setHospitalId] = useState("");
  const [inventory, setInventory] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
  });
  const [assigned, setAssigned] = useState([]);
  const [medQuery, setMedQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem("_id");
    setHospitalId(id);
    api
      .get(`/api/medication/${id}/medications`)
      .then((res) => setInventory(res.data || []))
      .catch(() => {
        setInventory([]);
        toast.error("Could not load inventory for medication assignment.");
      });

    const onClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const setField = (id, value) => setForm((prev) => ({ ...prev, [id]: value }));

  const suggestions = useMemo(() => {
    if (!inventory) return [];
    const q = medQuery.trim().toLowerCase();
    return inventory
      .filter(
        (m) =>
          !assigned.some((a) => a.med._id === m._id) &&
          (q === "" || m.nameOfDrugs?.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [inventory, medQuery, assigned]);

  const assign = (med) => {
    if ((med.quantityInStock || 0) < 1) {
      toast.error(`${med.nameOfDrugs} is out of stock.`);
      return;
    }
    setAssigned((prev) => [
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

  const updateAssigned = (index, patch) =>
    setAssigned((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );

  const removeAssigned = (index) =>
    setAssigned((prev) => prev.filter((_, i) => i !== index));

  const canSubmit =
    form.fullName.trim() &&
    form.dateOfBirth &&
    form.gender &&
    form.phoneNumber.trim();

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(
        "Full name, date of birth, gender, and phone number are required.",
      );
      return;
    }
    setSaving(true);
    try {
      const medicationsPayload = assigned.map((a) => ({
        medication: a.med._id,
        quantity: Number(a.quantity) || 1,
        startDate: a.startDate || Date.now(),
        endDate: null,
        custom: a.custom,
        customDosage: a.custom ? a.customDosage : undefined,
        customFrequency: a.custom
          ? {
              value: Number(a.customFrequency.value),
              unit: a.customFrequency.unit,
            }
          : undefined,
        customDuration: a.custom
          ? {
              value: Number(a.customDuration.value),
              unit: a.customDuration.unit,
            }
          : undefined,
      }));

      await api.post(`/api/user/hospital/${hospitalId}/users`, {
        ...form,
        medications: medicationsPayload,
      });
      toast.success(
        `${form.fullName} added${assigned.length ? ` with ${assigned.length} medication(s)` : ""}.`,
      );
      router.push("/dashboard/user");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not create the patient.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-24 sm:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New patient</h1>
          <p className="text-sm text-muted-foreground">
            Add their details and, optionally, assign medications in the same
            step.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/user")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Create patient"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr,1.2fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Patient details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="e.g. Chief Emeka Nwosu"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="dateOfBirth">Date of birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setField("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Gender *</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setField("gender", v)}
                >
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
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phoneNumber">Phone number *</Label>
              <Input
                id="phoneNumber"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                placeholder="+234…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="Used for medication schedule emails"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Medications</CardTitle>
                <CardDescription>
                  Assigned now — stock is reserved on creation
                </CardDescription>
              </div>
              {assigned.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {assigned.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="relative" ref={pickerRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={medQuery}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setMedQuery(e.target.value);
                  setPickerOpen(true);
                }}
                placeholder="Search inventory to assign…"
                className="pl-9"
              />
              {pickerOpen && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
                  {!inventory ? (
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      No matching medications in inventory.
                    </p>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto rosek-scroll">
                      {suggestions.map((m) => (
                        <li key={m._id}>
                          <button
                            type="button"
                            onClick={() => assign(m)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span className="flex items-center gap-2">
                              <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                              {m.nameOfDrugs}{" "}
                              <span className="text-xs text-muted-foreground">
                                {m.dosage} · {m.dosageForm}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {m.quantityInStock} in stock{" "}
                              <Plus className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {assigned.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
                <Pill className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No medications assigned yet — you can also do this later.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {assigned.map((a, i) => (
                  <li key={a.med._id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {a.med.nameOfDrugs}{" "}
                          <span className="font-normal text-muted-foreground">
                            {a.med.dosage} · {a.med.dosageForm}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Default: every {a.med.frequency?.value}{" "}
                          {a.med.frequency?.unit} for {a.med.duration?.value}{" "}
                          {a.med.duration?.unit}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAssigned(i)}
                        aria-label={`Remove ${a.med.nameOfDrugs}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          max={a.med.quantityInStock}
                          value={a.quantity}
                          onChange={(e) =>
                            updateAssigned(i, { quantity: e.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Start date</Label>
                        <Input
                          type="date"
                          value={a.startDate}
                          onChange={(e) =>
                            updateAssigned(i, { startDate: e.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">Custom regimen</p>
                        <p className="text-[11px] text-muted-foreground">
                          Override the default dosage and schedule
                        </p>
                      </div>
                      <Switch
                        checked={a.custom}
                        onCheckedChange={(v) =>
                          updateAssigned(i, { custom: v })
                        }
                        aria-label="Toggle custom regimen"
                      />
                    </div>
                    {a.custom && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="grid gap-1">
                          <Label className="text-xs">Dosage</Label>
                          <Input
                            value={a.customDosage}
                            onChange={(e) =>
                              updateAssigned(i, {
                                customDosage: e.target.value,
                              })
                            }
                            placeholder="e.g. 2.5mg"
                            className="h-9"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Every</Label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              value={a.customFrequency.value}
                              onChange={(e) =>
                                updateAssigned(i, {
                                  customFrequency: {
                                    ...a.customFrequency,
                                    value: e.target.value,
                                  },
                                })
                              }
                              className="h-9"
                            />
                            <Select
                              value={a.customFrequency.unit}
                              onValueChange={(v) =>
                                updateAssigned(i, {
                                  customFrequency: {
                                    ...a.customFrequency,
                                    unit: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="h-9 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">hours</SelectItem>
                                <SelectItem value="days">days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">For</Label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              min={1}
                              value={a.customDuration.value}
                              onChange={(e) =>
                                updateAssigned(i, {
                                  customDuration: {
                                    ...a.customDuration,
                                    value: e.target.value,
                                  },
                                })
                              }
                              className="h-9"
                            />
                            <Select
                              value={a.customDuration.unit}
                              onValueChange={(v) =>
                                updateAssigned(i, {
                                  customDuration: {
                                    ...a.customDuration,
                                    unit: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="h-9 w-24">
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
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3 sm:hidden">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/dashboard/user")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="flex-1 gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Create patient"}
          </Button>
        </div>
      </div>
    </div>
  );
}
