"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../axios/axiosConfig";
import { toast } from "sonner";
import AssistantSidebar from "../../components/dispense/AssistantSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Pill,
  MessageCircleWarning,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * AI Dispensing Workspace — Basket-level analysis
 *
 * The AI checks the ENTIRE basket each time a drug is added/removed:
 *  - Drug-drug interactions between all basket items
 *  - Drug-patient contraindications (age, gender, existing meds on record)
 *  - Duplicate therapy
 *  - Dosage concerns
 *
 * Each alert is a short 2-line summary with an "Elaborate" button
 * that opens the sidebar and asks the AI for a detailed breakdown.
 * ------------------------------------------------------------------------- */

export default function DispensePage() {
  const hospitalId =
    typeof window !== "undefined" ? localStorage.getItem("_id") : null;

  // ----- session state (sidebar reads this too) ----------------------------
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [drugInput, setDrugInput] = useState("");
  const [basket, setBasket] = useState([]);
  const [alerts, setAlerts] = useState([]); // [{severity, type, drugs, summary}]
  const [checking, setChecking] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarRef = useRef(null);

  const sessionId = useMemo(
    () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`,
    [],
  );

  // ----- initial data ------------------------------------------------------
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

  // ----- full basket analysis (fires on add / remove) ----------------------
  const analyseBasket = useCallback(
    async (nextBasket, currentPatient) => {
      if (nextBasket.length === 0) {
        setAlerts([]);
        return;
      }

      setChecking(true);
      try {
        const { data } = await api.post("/api/ai/check-basket", {
          basket: nextBasket.map((b) => ({ name: b.name, dosage: b.dosage })),
          patientId: currentPatient?._id || null,
          sessionId,
          hospitalId,
        });
        setAlerts(data.alerts || []);
      } catch {
        setAlerts([]);
      } finally {
        setChecking(false);
      }
    },
    [hospitalId, sessionId],
  );

  // ----- search suggestions ------------------------------------------------
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

  // ----- basket actions ----------------------------------------------------
  const addToBasket = (med) => {
    if ((med.quantityInStock || 0) < 1) {
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
    };
    const next = [...basket, item];
    setBasket(next);
    setDrugInput("");
    // Trigger AI analysis on the updated basket
    analyseBasket(next, patient);
  };

  const removeFromBasket = (index) => {
    const next = basket.filter((_, i) => i !== index);
    setBasket(next);
    analyseBasket(next, patient);
  };

  const updateQuantity = (index, quantity) => {
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
  };

  // Re-analyse when patient changes (their on-record meds affect contraindications)
  const handlePatientChange = (id) => {
    const p = patients.find((x) => x._id === id) || null;
    setPatient(p);
    if (basket.length > 0) analyseBasket(basket, p);
  };

  const total = basket.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // ----- which basket rows are flagged? ------------------------------------
  const alertsForDrug = (drugName) =>
    alerts.filter((a) =>
      a.drugs.some(
        (d) =>
          d.toLowerCase().includes(drugName.toLowerCase()) ||
          drugName.toLowerCase().includes(d.toLowerCase()),
      ),
    );

  // ----- elaborate: open sidebar with a specific question ------------------
  const elaborate = (alert) => {
    const drugList = alert.drugs.join(" and ");
    const question = `Elaborate on this warning about ${drugList}: "${alert.summary}" — explain the mechanism, the specific risk, monitoring recommendations, and any safer alternatives for this patient.`;
    sidebarRef.current?.askQuestion(question);
  };

  // ----- complete the dispense ---------------------------------------------
  const dispense = async () => {
    if (!patient) return toast.error("Select a patient first.");
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
        `Dispensed ${basket.length} item${basket.length > 1 ? "s" : ""} to ${patient.fullName}.`,
      );
      setBasket([]);
      setAlerts([]);
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

  // -------------------------------------------------------------------------
  return (
    <div
      className={`flex flex-col gap-4 pb-24 transition-[margin] duration-300 ${
        sidebarOpen ? "lg:mr-[24rem]" : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dispense</h1>
          <p className="text-sm text-muted-foreground">
            The AI checks your entire basket for interactions,
            contraindications, and therapy problems each time you add a drug.
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
        {/* ============== Left: patient + drug entry ============== */}
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
                <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {patientAge !== null && <span>{patientAge} yrs · </span>}
                  <span className="capitalize">{patient.gender}</span>
                  {" · "}
                  {patient.medications?.filter((m) => m.current).length ||
                    0}{" "}
                  active medication(s) on record
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add medication</CardTitle>
              <CardDescription>
                Search your inventory — the basket is analysed after each
                addition
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
                  No inventory match for "{drugInput.trim()}".
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============== Right: basket + alerts ============== */}
        <div className="flex flex-col gap-4 self-start">
          {/* Basket */}
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
                <div className="flex items-center gap-2">
                  {checking && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                      Analysing…
                    </span>
                  )}
                  {basket.length > 0 && (
                    <Badge variant="secondary">
                      {basket.length} item{basket.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
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
                  {basket.map((item, i) => {
                    const drugAlerts = alertsForDrug(item.name);
                    const flagged = drugAlerts.length > 0;
                    return (
                      <li
                        key={`${item.med}-${i}`}
                        className={`rounded-lg border px-3 py-2.5 transition-colors ${
                          flagged
                            ? "border-l-4 border-red-300 border-l-red-500 bg-red-50/70 dark:bg-red-950/30"
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

                        {/* Per-drug alerts: 2-line summary + Elaborate button */}
                        {drugAlerts.map((alert, ai) => (
                          <div
                            key={ai}
                            className="mt-2 flex items-start justify-between gap-2 rounded-md bg-red-100/80 px-3 py-2 dark:bg-red-950/50"
                          >
                            <div className="flex items-start gap-1.5">
                              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                              <p className="text-xs leading-relaxed text-red-800 dark:text-red-200">
                                {alert.summary}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 gap-1 px-2 text-[11px] text-red-700 hover:bg-red-200/60 hover:text-red-900 dark:text-red-300 dark:hover:bg-red-900/40"
                              onClick={() => elaborate(alert)}
                            >
                              <MessageCircleWarning className="h-3 w-3" />
                              Elaborate
                            </Button>
                          </div>
                        ))}
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

          {/* Basket-level alert summary (for alerts spanning multiple drugs) */}
          {alerts.length > 0 && !checking && (
            <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {alerts.length} alert{alerts.length > 1 ? "s" : ""} found in
                    this basket
                  </p>
                </div>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Review each flagged item above. Click "Elaborate" for a
                  detailed clinical breakdown from the assistant.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ============== Sidebar ============== */}
      <AssistantSidebar
        ref={sidebarRef}
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        patient={patient}
        basket={basket}
      />
    </div>
  );
}
