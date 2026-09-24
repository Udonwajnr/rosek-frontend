"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Pill,
  Phone,
  Mail,
  Cake,
  Users,
  ShoppingCart,
  ClipboardList,
  CalendarCheck,
  CalendarX,
  CalendarOff,
  CalendarClock,
  AlertTriangle,
  HeartPulse,
  Scale,
  Baby,
  FileText,
} from "lucide-react";

/* ── Formatting helpers ─────────────────────────────────────────────── */

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const age = (dob) =>
  dob
    ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000))
    : null;
const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const DAY_MS = 24 * 3600 * 1000;

// { value: 8, unit: "hours" } -> "every 8 hours (3× a day)"
const formatFrequency = (f) => {
  if (!f?.value || !f?.unit) return null;
  const unit = f.value === 1 ? f.unit.replace(/s$/, "") : f.unit;
  const perDay = f.unit === "hours" ? 24 / f.value : 1 / f.value;
  const extra = Number.isInteger(perDay)
    ? perDay === 1
      ? " (once a day)"
      : ` (${perDay}× a day)`
    : "";
  return `every ${f.value} ${unit}${extra}`;
};

// { value: 7, unit: "days" } -> "7 days"
const formatDuration = (d) => {
  if (!d?.value || !d?.unit) return null;
  const unit = d.value === 1 ? d.unit.replace(/s$/, "") : d.unit;
  return `${d.value} ${unit}`;
};

const doseUnit = (dosage) =>
  String(dosage || "")
    .match(/\d\s*(mg|ml|mcg|g)\b/i)?.[1]
    ?.toLowerCase() || "";

// Custom regimen wins over the drug's defaults
const scheduleFor = (m) => {
  const med = m.medication || {};
  const useCustom = m.custom;
  const dose =
    useCustom && m.customDosage
      ? `${m.customDosage} ${doseUnit(med.dosage)}`.trim()
      : med.dosageAmount
        ? `${med.dosageAmount} × ${med.dosage || "dose"}`
        : med.dosage;
  const frequency = formatFrequency(
    useCustom && m.customFrequency?.value ? m.customFrequency : med.frequency,
  );
  const duration = formatDuration(
    useCustom && m.customDuration?.value ? m.customDuration : med.duration,
  );
  return [dose, frequency, duration && `for ${duration}`]
    .filter(Boolean)
    .join(" · ");
};

// How far through the course: { daysLeft, pct } or null
const courseProgress = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!(e > s)) return null;
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
  const daysLeft = Math.max(0, Math.ceil((e - now) / DAY_MS));
  return { pct, daysLeft };
};

const PREGNANCY_LABEL = {
  pregnant: "Pregnant",
  breastfeeding: "Breastfeeding",
  not_pregnant: "Not pregnant",
};

/* ── Small components ───────────────────────────────────────────────── */

function IcsPill({ ics }) {
  const status = ics?.status || "no_email";
  if (status === "sent")
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        title={
          ics?.sentAt ? `Sent ${new Date(ics.sentAt).toLocaleString()}` : "Sent"
        }
      >
        <CalendarCheck className="h-3 w-3" /> Calendar sent
      </span>
    );
  if (status === "failed")
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
        title={ics?.error || "Sending failed"}
      >
        <CalendarX className="h-3 w-3" /> Calendar failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <CalendarOff className="h-3 w-3" /> No email
    </span>
  );
}

function MedStatusPill({ current }) {
  return current ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Completed
    </span>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="truncate font-medium">{children}</div>
      </div>
    </div>
  );
}

function Chip({ children, danger }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        danger
          ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          : "border-border bg-muted text-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function MedicalHistoryCard({ history, gender, editHref }) {
  const [expanded, setExpanded] = useState(false);
  const mh = history || {};
  const allergies = mh.allergies || [];
  const conditions = mh.conditions || [];
  const notes = (mh.notes || "").trim();
  const pregnancy =
    gender === "female" ? PREGNANCY_LABEL[mh.pregnancyStatus] : null;
  const isEmpty =
    !allergies.length &&
    !conditions.length &&
    !notes &&
    !mh.weightKg &&
    !pregnancy;
  const longNotes = notes.length > 280;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="h-4 w-4 text-primary" />
          Medical history
        </CardTitle>
        {mh.updatedAt && (
          <CardDescription>Updated {shortDate(mh.updatedAt)}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isEmpty ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No medical history recorded. The AI can only check age, gender and
              medications for this patient.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={editHref}>Add medical history</Link>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Allergies</p>
              {allergies.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a) => (
                    <Chip key={a} danger>
                      {a}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">None recorded</p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Conditions</p>
              {conditions.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {conditions.map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">None recorded</p>
              )}
            </div>

            {(mh.weightKg || pregnancy) && (
              <div className="grid grid-cols-2 gap-3">
                {mh.weightKg && (
                  <InfoRow icon={Scale} label="Weight">
                    {mh.weightKg} kg
                  </InfoRow>
                )}
                {pregnancy && (
                  <InfoRow icon={Baby} label="Pregnancy">
                    {pregnancy}
                  </InfoRow>
                )}
              </div>
            )}

            {notes && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" /> Medical record notes
                </p>
                <p
                  className={`whitespace-pre-wrap rounded-lg bg-muted/60 p-3 leading-relaxed ${
                    longNotes && !expanded ? "line-clamp-6" : ""
                  }`}
                >
                  {notes}
                </p>
                {longNotes && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {expanded ? "Show less" : "Show full notes"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MedTable({ meds, showProgress }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Medication</th>
            <th className="px-4 py-3 text-right font-medium">Qty</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">
              Start
            </th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">End</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {meds.map((m, i) => {
            const schedule = scheduleFor(m);
            const progress = showProgress
              ? courseProgress(m.startDate, m.endDate)
              : null;
            return (
              <tr
                key={m._id || i}
                className="border-b align-top last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Pill className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.medication?.nameOfDrugs || "(deleted drug)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.medication?.dosage}
                        {m.medication?.dosageForm &&
                          ` · ${m.medication.dosageForm}`}
                      </p>
                      {schedule && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-foreground/80">
                          <CalendarClock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                          <span>
                            {schedule}
                            {m.custom && (
                              <span className="ml-1 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold text-primary">
                                Custom
                              </span>
                            )}
                          </span>
                        </p>
                      )}
                      {/* Dates on phones, where the Start/End columns are hidden */}
                      <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">
                        {shortDate(m.startDate)} to {shortDate(m.endDate)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {m.quantity}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                  {shortDate(m.startDate)}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                  {shortDate(m.endDate)}
                </td>
                <td className="px-4 py-3">
                  <MedStatusPill current={m.current} />
                  {progress && (
                    <div className="mt-2 w-24">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {progress.daysLeft === 0
                          ? "Ends today"
                          : `${progress.daysLeft} day${progress.daysLeft === 1 ? "" : "s"} left`}
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function PatientDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hospitalId = localStorage.getItem("_id");
    if (!hospitalId || !id) return;
    api
      .get(`/api/user/hospital/${hospitalId}/users/${id}`)
      .then((res) => setUser(res.data))
      .catch(() => setError("Could not load this patient"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
        </div>
        <Skeleton className="h-[320px]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">{error || "Patient not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/user">Back to patients</Link>
        </Button>
      </div>
    );
  }

  const editHref = `/dashboard/user/edit/${id}`;
  const mh = user.medicalHistory || {};
  const allergies = mh.allergies || [];
  const meds = user.medications || [];
  const currentMeds = meds.filter((m) => m.current);
  const pastMeds = meds.filter((m) => !m.current);
  const purchases = [...(user.purchases || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const totalSpent = purchases.reduce((s, p) => s + (p.totalPurchase || 0), 0);
  const lastVisit = purchases[0]?.createdAt;
  const patientAge = age(user.dateOfBirth);
  const isPregnantOrBf =
    user.gender === "female" &&
    ["pregnant", "breastfeeding"].includes(mh.pregnancyStatus);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/user" aria-label="Back to patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {initials(user.fullName)}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {user.fullName}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              {[
                user.gender,
                patientAge !== null && `${patientAge} yrs`,
                mh.weightKg && `${mh.weightKg} kg`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href={editHref}>
            <Pencil className="h-4 w-4" /> Edit patient
          </Link>
        </Button>
      </div>

      {/* Safety banner: the first thing a pharmacist should see */}
      {(allergies.length > 0 || isPregnantOrBf) && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="space-y-0.5 text-sm text-red-900 dark:text-red-100">
            {allergies.length > 0 && (
              <p>
                <span className="font-semibold">Allergies:</span>{" "}
                {allergies.join(", ")}
              </p>
            )}
            {isPregnantOrBf && (
              <p>
                <span className="font-semibold">
                  {PREGNANCY_LABEL[mh.pregnancyStatus]}.
                </span>{" "}
                Check pregnancy and lactation safety before dispensing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Pill}
          label="Active medications"
          value={currentMeds.length}
        />
        <Stat icon={ShoppingCart} label="Purchases" value={purchases.length} />
        <Stat
          icon={ClipboardList}
          label="Total spent"
          value={naira(totalSpent)}
        />
        <Stat
          icon={CalendarClock}
          label="Last visit"
          value={lastVisit ? shortDate(lastVisit) : "—"}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
        {/* Left: medical history + contact */}
        <div className="flex flex-col gap-4">
          <MedicalHistoryCard
            history={user.medicalHistory}
            gender={user.gender}
            editHref={editHref}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Phone} label="Phone">
                {user.phoneNumber ? (
                  <a
                    href={`tel:${user.phoneNumber}`}
                    className="hover:underline"
                  >
                    {user.phoneNumber}
                  </a>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                {user.email ? (
                  <a href={`mailto:${user.email}`} className="hover:underline">
                    {user.email}
                  </a>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow icon={Cake} label="Date of birth">
                {shortDate(user.dateOfBirth)}
              </InfoRow>
              <p className="pt-1 text-xs text-muted-foreground">
                Registered {shortDate(user.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: medications + purchases */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current medications</CardTitle>
              <CardDescription>
                What this patient is on right now, with dose and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {currentMeds.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No active medications.
                </p>
              ) : (
                <MedTable meds={currentMeds} showProgress />
              )}
            </CardContent>
          </Card>

          {pastMeds.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Past medications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedTable meds={pastMeds} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Purchase history</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {purchases.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No purchases recorded for this patient.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Items</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p) => (
                        <tr
                          key={p._id}
                          className="border-b align-top last:border-0 hover:bg-muted/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            <p>{shortDate(p.createdAt)}</p>
                            <div className="mt-1">
                              <IcsPill ics={p.icsEmail} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(p.medications || []).map((m, i) => {
                                // Shows the dose if the purchase saved one
                                const extra = [
                                  m.dose?.value &&
                                    `${m.dose.value} ${m.dose.unit || ""}`.trim(),
                                  formatFrequency(m.frequency),
                                  formatDuration(m.duration),
                                ]
                                  .filter(Boolean)
                                  .join(" · ");
                                return (
                                  <span
                                    key={m._id || i}
                                    className="rounded-lg border bg-background px-2.5 py-1 text-xs"
                                    title={extra || undefined}
                                  >
                                    {m.medication?.nameOfDrugs || "(deleted)"} ×{" "}
                                    {m.quantity}
                                    {extra && (
                                      <span className="block text-[11px] text-muted-foreground">
                                        {extra}
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {naira(p.totalPurchase)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
