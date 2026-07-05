"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../axios/axiosConfig";
import { toast } from "sonner";
import AssistantSidebar from "../../components/dispense/AssistantSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Pill,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * AI Dispensing Workspace
 * - Debounced (300ms) live interaction check as the pharmacist types
 * - Severity-aware basket rows: soft red highlight + one-line advisory, no popups
 * - Collapsible clinical assistant sidebar synced with this exact state
 * ------------------------------------------------------------------------- */

const CHECK_IDLE = { status: "idle" };

export default function DispensePage() {
  const hospitalId =
    typeof window !== "undefined" ? localStorage.getItem("_id") : null;

  // ----- session state (the single source of truth the sidebar also reads) --
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [drugInput, setDrugInput] = useState("");
  const [check, setCheck] = useState(CHECK_IDLE); // idle | checking | clear | critical
  const [basket, setBasket] = useState([]); // {med, name, dosage, quantity, price, flag?}
  const [dispensing, setDispensing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // One ID per dispensing session so backend logs group naturally
  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    []
  );

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // ----- initial data ------------------------------------------------------
  useEffect(() => {
    if (!hospitalId) return;
    const load = async () => {
      try {
        const [usersRes, medsRes] = await Promise.all([
          api.get(`/api/user/hospital/${hospitalId}/users`),
          api.get(`/api/medication/${hospitalId}/medications`),
        ]);
        setPatients(usersRes.data?.users || usersRes.data || []);
        setInventory(medsRes.data?.medications || medsRes.data || []);
      } catch {
        toast.error("Could not load patients or inventory. Refresh to retry.");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [hospitalId]);

  // ----- the live typing trigger (brief §1) --------------------------------
  const runInteractionCheck = useCallback(
    async (drugName, currentBasket, currentPatient) => {
      // Cancel any in-flight check so a stale response can't overwrite a newer one
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setCheck({ status: "checking" });
      try {
        const { data } = await api.post(
          "/api/ai/check-interaction",
          {
            drugName,
            patientId: currentPatient?._id || null,
            basket: currentBasket.map((b) => ({ name: b.name, dosage: b.dosage })),
            sessionId,
            hospitalId,
          },
          { signal: controller.signal }
        );

        if (data.severity === "critical") {
          setCheck({
            status: "critical",
            advisory: data.advisory,
            interactingWith: data.interactingWith || [],
          });
        } else {
          setCheck({ status: "clear", aiUnavailable: data.aiUnavailable });
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setCheck({ status: "clear", aiUnavailable: true });
      }
    },
    [hospitalId, sessionId]
  );

  const handleDrugInput = (value) => {
    setDrugInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setCheck(CHECK_IDLE);
      return;
    }
    // 300ms after the pharmacist stops typing → background check
    debounceRef.current = setTimeout(() => {
      runInteractionCheck(value.trim(), basket, patient);
    }, 300);
  };

  // Inventory suggestions matching what's typed
  const suggestions = useMemo(() => {
    const q = drugInput.trim().toLowerCase();
    if (q.length < 2) return [];
    return inventory
      .filter(
        (m) =>
          m.nameOfDrugs?.toLowerCase().includes(q) &&
          !basket.some((b) => b.med === m._id)
      )
      .slice(0, 5);
  }, [drugInput, inventory, basket]);

  // ----- basket actions -----------------------------------------------------
  const addToBasket = (med) => {
    if (med.quantityInStock < 1) {
      toast.error(`${med.nameOfDrugs} is out of stock.`);
      return;
    }
    const item = {
      med: med._id,
      name: med.nameOfDrugs,
      dosage: med.dosage,
      dosageForm: med.dosageForm,
      price: med.price || 0,
      stock: med.quantityInStock,
      quantity: 1,
      // Carry the live check result onto the row (brief §3)
      flag:
        check.status === "critical"
          ? { advisory: check.advisory, interactingWith: check.interactingWith }
          : null,
    };
    setBasket((prev) => [...prev, item]);
    setDrugInput("");
    setCheck(CHECK_IDLE);
  };

  const updateQuantity = (index, quantity) => {
    setBasket((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, Number(quantity) || 1)) }
          : item
      )
    );
  };

  const removeFromBasket = (index) => {
    setBasket((prev) => prev.filter((_, i) => i !== index));
  };

  const total = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ----- complete the dispense ---------------------------------------------
  const dispense = async () => {
    if (!patient) {
      toast.error("Select a patient first.");
      return;
    }
    if (basket.length === 0) return;

    setDispensing(true);
    try {
      await api.post("/api/purchase", {
        userId: patient._id,
        hospitalId,
        medications: basket.map((item) => ({
          medication: item.med,
          quantity: item.quantity,
        })),
      });
      toast.success(
        `Dispensed ${basket.length} item${basket.length > 1 ? "s" : ""} to ${patient.fullName}.`
      );
      setBasket([]);
      setCheck(CHECK_IDLE);
    } catch (err) {
      toast.error(err.response?.data?.message || "Dispense failed. Nothing was recorded.");
    } finally {
      setDispensing(false);
    }
  };

  const patientAge = patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  // ---------------------------------------------------------------------------
  return (
    <div
      className={`flex flex-col gap-4 pb-24 transition-[margin] duration-300 ${
        sidebarOpen ? "lg:mr-[24rem]" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dispense</h1>
          <p className="text-sm text-muted-foreground">
            Interactions are checked live as you type — only critical risks are flagged.
          </p>
        </div>
        <Button
          variant={sidebarOpen ? "secondary" : "default"}
          onClick={() => setSidebarOpen((v) => !v)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {sidebarOpen ? "Hide assistant" : "Ask the assistant"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        {/* ---------------- Left: patient + drug entry ---------------- */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patient</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  onValueChange={(id) =>
                    setPatient(patients.find((p) => p._id === id) || null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {patient && (
                <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {patientAge !== null && <span>{patientAge} yrs · </span>}
                  <span className="capitalize">{patient.gender}</span>
                  {" · "}
                  {patient.medications?.filter((m) => m.current).length || 0} active medication(s) on record
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={check.status === "critical" ? "border-red-300" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add medication</CardTitle>
              <CardDescription>Checked automatically 300ms after you stop typing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  value={drugInput}
                  onChange={(e) => handleDrugInput(e.target.value)}
                  placeholder="Start typing a drug name…"
                  className={
                    check.status === "critical"
                      ? "border-red-400 pr-9 focus-visible:ring-red-400"
                      : "pr-9"
                  }
                />
                {/* The live-check indicator */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {check.status === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  )}
                  {check.status === "clear" && (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  )}
                  {check.status === "critical" && (
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>

              {/* One conversational sentence, right beneath the field (brief §3) */}
              {check.status === "critical" && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                  {check.advisory}
                </p>
              )}
              {check.status === "clear" && check.aiUnavailable && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Live checking unavailable right now — verify interactions manually.
                </p>
              )}

              {/* Inventory suggestions */}
              {suggestions.length > 0 && (
                <ul className="mt-2 divide-y rounded-lg border">
                  {suggestions.map((med) => (
                    <li key={med._id}>
                      <button
                        onClick={() => addToBasket(med)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      >
                        <span className="flex items-center gap-2">
                          <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {med.nameOfDrugs}{" "}
                            <span className="text-xs text-muted-foreground">
                              {med.dosage} · {med.dosageForm}
                            </span>
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {med.quantityInStock} in stock
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {drugInput.trim().length >= 2 && suggestions.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  No inventory match — the interaction check still runs, but only stocked
                  drugs can be added to the basket.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---------------- Right: the basket ---------------- */}
        <Card className="self-start">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Dispensing basket</CardTitle>
                <CardDescription>
                  {patient ? `For ${patient.fullName}` : "Select a patient to dispense"}
                </CardDescription>
              </div>
              {basket.length > 0 && (
                <Badge variant="secondary">{basket.length} item{basket.length > 1 ? "s" : ""}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {basket.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
                <Pill className="h-6 w-6 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  The basket is empty. Search a drug on the left to begin.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {basket.map((item, i) => (
                  <li
                    key={`${item.med}-${i}`}
                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                      item.flag
                        ? "border-l-4 border-red-300 border-l-red-500 bg-red-50/70"
                        : "bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}{" "}
                          <span className="font-normal text-muted-foreground">
                            {item.dosage} · {item.dosageForm}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₦{item.price.toLocaleString()} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(i, e.target.value)}
                          className="h-8 w-16 text-center"
                          aria-label={`Quantity of ${item.name}`}
                        />
                        <span className="w-20 text-right text-sm tabular-nums">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromBasket(i)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    {/* Advisory lives with the flagged line item — no popups */}
                    {item.flag && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-red-800">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item.flag.advisory}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {basket.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold tabular-nums">
                    ₦{total.toLocaleString()}
                  </p>
                </div>
                <Button onClick={dispense} disabled={dispensing || !patient} className="gap-2">
                  {dispensing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {dispensing ? "Dispensing…" : "Complete dispense"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Collapsible clinical assistant (brief §4) ---------------- */}
      <AssistantSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        patient={patient}
        basket={basket}
      />
    </div>
  );
}