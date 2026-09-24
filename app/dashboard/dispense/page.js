"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../axios/axiosConfig";
import { toast } from "sonner";
import AssistantSidebar from "../../components/dispense/AssistantSidebar";
import {
  DOSE_UNITS,
  FREQUENCY_UNITS,
  DURATION_UNITS,
  defaultRegimen,
  dailyTotal,
  timesPerDayLabel,
  isRegimenComplete,
  toAIBasketItem,
  toRegimenPayload,
} from "../../components/dispense/regimen";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Pill,
  MessageCircleWarning,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * AI Dispensing Workspace
 *
 * Each basket item carries its regimen: dose, frequency, duration.
 * The basket is re-analysed shortly after any drug, regimen or patient change,
 * so the AI can catch overdoses and unsafe durations, not just interactions.
 * ------------------------------------------------------------------------- */

const ASSISTANT_SIZE_KEY = "assistantSize";
const ANALYSE_DELAY_MS = 700;

const PUSH_CLASS = {
  side: "lg:mr-[24rem]",
  wide: "2xl:mr-[42rem]",
  full: "",
};

const invalid = (show, bad) =>
  show && bad ? "border-red-500 focus-visible:ring-red-500" : "";

export default function DispensePage() {
  const hospitalId =
    typeof window !== "undefined" ? localStorage.getItem("_id") : null;

  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [drugInput, setDrugInput] = useState("");
  const [basket, setBasket] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [showRegimenErrors, setShowRegimenErrors] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantSize, setAssistantSize] = useState("side");

  const sidebarRef = useRef(null);
  const requestIdRef = useRef(0);

  const sessionId = useMemo(
    () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`,
    [],
  );

  // ----- assistant size ---------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ASSISTANT_SIZE_KEY);
      if (saved && PUSH_CLASS[saved] !== undefined) setAssistantSize(saved);
    } catch {}
  }, []);

  const changeAssistantSize = useCallback((size) => {
    setAssistantSize(size);
    try {
      localStorage.setItem(ASSISTANT_SIZE_KEY, size);
    } catch {}
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // ----- load patients + inventory ----------------------------------------
  useEffect(() => {
    if (!hospitalId) return;
    (async () => {
      try {
        const [usersRes, medsRes] = await Promise.all([
          api.get(`/api/user/hospital/${hospitalId}/users`),
          api.get(`/api/medication/${hospitalId}/medications`),
        ]);
        setPatients(usersRes.data?.users || usersRes.data || []);
        setInventory(medsRes.data?.medications || medsRes.data || []);
      } catch {
        toast.error("Could not load data. Refresh to retry.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, [hospitalId]);

  // ----- full basket analysis ---------------------------------------------
  const analyseBasket = useCallback(
    async (currentBasket, currentPatient) => {
      // Only the latest request may update the UI (typing fires many changes)
      const requestId = ++requestIdRef.current;
      setChecking(true);
      try {
        const { data } = await api.post("/api/ai/check-basket", {
          basket: currentBasket.map(toAIBasketItem),
          patientId: currentPatient?._id || null,
          sessionId,
          hospitalId,
        });
        if (requestId === requestIdRef.current) setAlerts(data.alerts || []);
      } catch {
        if (requestId === requestIdRef.current) setAlerts([]);
      } finally {
        if (requestId === requestIdRef.current) setChecking(false);
      }
    },
    [hospitalId, sessionId],
  );

  // Re-analyse when drugs, regimens or the patient change (not quantity)
  const analysisKey = useMemo(
    () =>
      JSON.stringify({
        patient: patient?._id || null,
        basket: basket.map(toAIBasketItem),
      }),
    [basket, patient],
  );

  useEffect(() => {
    if (basket.length === 0) {
      requestIdRef.current++; // cancel anything in flight
      setAlerts([]);
      setChecking(false);
      return;
    }
    const timer = setTimeout(
      () => analyseBasket(basket, patient),
      ANALYSE_DELAY_MS,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisKey]);

  // ----- inventory suggestions --------------------------------------------
  const suggestions = useMemo(() => {
    const q = drugInput.trim().toLowerCase();
    if (q.length < 2) return [];
    return inventory
      .filter(
        (m) =>
          m.nameOfDrugs?.toLowerCase().includes(q) &&
          !basket.some((b) => b.med === m._id),
      )
      .slice(0, 5);
  }, [drugInput, inventory, basket]);

  // ----- basket actions ---------------------------------------------------
  const addToBasket = (med) => {
    if ((med.quantityInStock || 0) < 1) {
      toast.error(`${med.nameOfDrugs} is out of stock.`);
      return;
    }
    setBasket((prev) => [
      ...prev,
      {
        med: med._id,
        name: med.nameOfDrugs,
        dosage: med.dosage,
        dosageForm: med.dosageForm,
        price: med.price || 0,
        stock: med.quantityInStock,
        quantity: 1,
        ...defaultRegimen(med), // prefilled from inventory defaults
      },
    ]);
    setDrugInput("");
  };

  const removeFromBasket = (index) =>
    setBasket((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index, patch) =>
    setBasket((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const updateQuantity = (index, quantity) =>
    setBasket((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(item.stock, Number(quantity) || 1),
              ),
            }
          : item,
      ),
    );

  const handlePatientChange = (id) =>
    setPatient(patients.find((x) => x._id === id) || null);

  const total = basket.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // ----- elaborate: open sidebar with a specific alert --------------------
  const elaborate = (alert) => {
    const question = `Elaborate on this: "${alert.line}" — explain the mechanism, specific risk for this patient, monitoring recommendations, and safer alternatives.`;
    sidebarRef.current?.askQuestion(question);
  };

  // ----- dispense ---------------------------------------------------------
  const dispense = async () => {
    if (!patient) return toast.error("Select a patient first.");
    if (basket.length === 0) return;

    const incomplete = basket.find((b) => !isRegimenComplete(b));
    if (incomplete) {
      setShowRegimenErrors(true);
      return toast.error(
        `Add the dose, frequency and duration for ${incomplete.name}.`,
      );
    }

    setDispensing(true);
    try {
      await api.post("/api/purchase", {
        userId: patient._id,
        hospitalId,
        medications: basket.map((item) => ({
          medication: item.med,
          quantity: item.quantity,
          ...toRegimenPayload(item),
        })),
      });
      toast.success(
        `Dispensed ${basket.length} item${basket.length > 1 ? "s" : ""} to ${patient.fullName}.`,
      );
      setBasket([]);
      setShowRegimenErrors(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Dispense failed.");
    } finally {
      setDispensing(false);
    }
  };

  const patientAge = patient?.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(patient.dateOfBirth)) /
          (365.25 * 24 * 3600 * 1000),
      )
    : null;

  const mh = patient?.medicalHistory;
  const hasHistory =
    !!mh &&
    (mh.allergies?.length > 0 || mh.conditions?.length > 0 || !!mh.notes);

  // -----------------------------------------------------------------------
  return (
    <div
      className={`flex flex-col gap-4 pb-24 transition-[margin] duration-300 ${
        sidebarOpen ? PUSH_CLASS[assistantSize] : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dispense</h1>
          <p className="text-sm text-muted-foreground">
            Add drugs and their doses. The AI checks the full combination for
            interactions, contraindications, and dosing problems.
          </p>
        </div>
        <Button
          variant={sidebarOpen ? "secondary" : "default"}
          onClick={() => setSidebarOpen((v) => !v)}
          className="hidden gap-2 sm:inline-flex"
        >
          <Sparkles className="h-4 w-4" />
          {sidebarOpen ? "Hide assistant" : "Ask the assistant"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        {/* ============== Left: patient + drug search ============== */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patient</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={handlePatientChange}>
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
                <div className="mt-3 space-y-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    {patientAge !== null && <span>{patientAge} yrs · </span>}
                    <span className="capitalize">{patient.gender}</span>
                    {" · "}
                    {patient.medications?.filter((m) => m.current).length ||
                      0}{" "}
                    active medication(s) on record
                  </p>
                  {mh?.allergies?.length > 0 && (
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Allergies: {mh.allergies.join(", ")}
                    </p>
                  )}
                  {mh?.conditions?.length > 0 && (
                    <p>Conditions: {mh.conditions.join(", ")}</p>
                  )}
                  {!hasHistory && (
                    <p className="text-amber-600 dark:text-amber-400">
                      No medical history recorded. AI checks are limited to age,
                      gender and meds on record.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add medication</CardTitle>
              <CardDescription>
                Search inventory. Doses are prefilled from each drug&apos;s
                defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={drugInput}
                onChange={(e) => setDrugInput(e.target.value)}
                placeholder="Start typing a drug name…"
              />
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
                  No inventory match for &ldquo;{drugInput.trim()}&rdquo;.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============== Right: basket, then warnings ============== */}
        <div className="flex flex-col gap-4 self-start">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Dispensing basket</CardTitle>
                  <CardDescription>
                    {patient
                      ? `For ${patient.fullName}`
                      : "Select a patient to dispense"}
                  </CardDescription>
                </div>
                {basket.length > 0 && (
                  <Badge variant="secondary">
                    {basket.length} item{basket.length > 1 ? "s" : ""}
                  </Badge>
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
                <ul className="divide-y">
                  {basket.map((item, i) => {
                    const perDay = dailyTotal(item);
                    const howOften = timesPerDayLabel(item);
                    const doseBad = !(Number(item.doseValue) > 0);
                    const freqBad = !(Number(item.frequencyValue) > 0);
                    const durationBad = !(Number(item.durationValue) > 0);

                    return (
                      <li key={`${item.med}-${i}`} className="py-3">
                        {/* Drug row */}
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
                              onChange={(e) =>
                                updateQuantity(i, e.target.value)
                              }
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

                        {/* Regimen: dose, frequency, duration */}
                        <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 sm:grid-cols-3">
                          {/* Dose */}
                          <div className="grid content-start gap-1">
                            <Label
                              htmlFor={`dose-${i}`}
                              className="text-[11px] text-muted-foreground"
                            >
                              Dose
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                id={`dose-${i}`}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="any"
                                value={item.doseValue}
                                onChange={(e) =>
                                  updateItem(i, { doseValue: e.target.value })
                                }
                                placeholder="e.g. 500"
                                className={`h-8 min-w-0 ${invalid(showRegimenErrors, doseBad)}`}
                              />
                              <Select
                                value={item.doseUnit}
                                onValueChange={(v) =>
                                  updateItem(i, { doseUnit: v })
                                }
                              >
                                <SelectTrigger
                                  className="h-8 w-[4.5rem] shrink-0"
                                  aria-label="Dose unit"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOSE_UNITS.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {perDay && (
                              <p className="text-[10px] text-muted-foreground">
                                {perDay} per day
                              </p>
                            )}
                          </div>

                          {/* Frequency: "Every [8] [hours]", full width on phones */}
                          <div className="order-last col-span-2 grid content-start gap-1 sm:order-none sm:col-span-1">
                            <Label
                              htmlFor={`frequency-${i}`}
                              className="text-[11px] text-muted-foreground"
                            >
                              Frequency
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="shrink-0 text-xs text-muted-foreground">
                                Every
                              </span>
                              <Input
                                id={`frequency-${i}`}
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={item.frequencyValue}
                                onChange={(e) =>
                                  updateItem(i, {
                                    frequencyValue: e.target.value,
                                  })
                                }
                                placeholder="e.g. 8"
                                className={`h-8 min-w-0 ${invalid(showRegimenErrors, freqBad)}`}
                              />
                              <Select
                                value={item.frequencyUnit}
                                onValueChange={(v) =>
                                  updateItem(i, { frequencyUnit: v })
                                }
                              >
                                <SelectTrigger
                                  className="h-8 w-[5.5rem] shrink-0"
                                  aria-label="Frequency unit"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FREQUENCY_UNITS.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {howOften && (
                              <p className="text-[10px] text-muted-foreground">
                                {howOften}
                              </p>
                            )}
                          </div>

                          {/* Duration */}
                          <div className="grid content-start gap-1">
                            <Label
                              htmlFor={`duration-${i}`}
                              className="text-[11px] text-muted-foreground"
                            >
                              Duration
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                id={`duration-${i}`}
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={item.durationValue}
                                onChange={(e) =>
                                  updateItem(i, {
                                    durationValue: e.target.value,
                                  })
                                }
                                placeholder="e.g. 5"
                                className={`h-8 min-w-0 ${invalid(showRegimenErrors, durationBad)}`}
                              />
                              <Select
                                value={item.durationUnit}
                                onValueChange={(v) =>
                                  updateItem(i, { durationUnit: v })
                                }
                              >
                                <SelectTrigger
                                  className="h-8 w-[5.5rem] shrink-0"
                                  aria-label="Duration unit"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DURATION_UNITS.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
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
                  <Button
                    onClick={dispense}
                    disabled={dispensing || !patient}
                    className="gap-2"
                  >
                    {dispensing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {dispensing ? "Dispensing…" : "Complete dispense"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── CENTRAL WARNING BOX ── */}
          {(alerts.length > 0 || checking) && (
            <Card className="border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30">
              <CardContent className="p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                      {checking
                        ? "Analysing basket…"
                        : `${alerts.length} warning${alerts.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {checking && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                  )}
                </div>

                {!checking && alerts.length > 0 && (
                  <ul className="space-y-2">
                    {alerts.map((alert, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-md bg-white/70 px-3 py-2 dark:bg-red-950/50"
                      >
                        <p className="text-xs leading-relaxed text-red-900 dark:text-red-100">
                          <span className="font-semibold">
                            {alert.drugs.join(" + ")}
                          </span>
                          {" — "}
                          {alert.line.replace(/^[^—–]+[—–]\s*/, "")}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 shrink-0 gap-1 px-2 text-[11px] text-red-700 hover:bg-red-200/60 hover:text-red-900 dark:text-red-300 dark:hover:bg-red-900/40"
                          onClick={() => elaborate(alert)}
                        >
                          <MessageCircleWarning className="h-3 w-3" />
                          Elaborate
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ============== Mobile: sticky "Ask the assistant" bar ============== */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background p-3 sm:hidden">
        <Button
          variant={sidebarOpen ? "secondary" : "default"}
          onClick={() => setSidebarOpen((v) => !v)}
          className="w-full gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {sidebarOpen ? "Hide assistant" : "Ask the assistant"}
        </Button>
      </div>

      {/* ============== Sidebar ============== */}
      <AssistantSidebar
        ref={sidebarRef}
        open={sidebarOpen}
        onOpen={openSidebar}
        onClose={closeSidebar}
        patient={patient}
        basket={basket}
        size={assistantSize}
        onSizeChange={changeAssistantSize}
      />
    </div>
  );
}
