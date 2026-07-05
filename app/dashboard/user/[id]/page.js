"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";

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

function MedTable({ meds }) {
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
          {meds.map((m, i) => (
            <tr
              key={m._id || i}
              className="border-b last:border-0 hover:bg-muted/40"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
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
                      {m.custom && " · custom regimen"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {m.quantity}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {shortDate(m.startDate)}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {shortDate(m.endDate)}
              </td>
              <td className="px-4 py-3">
                <MedStatusPill current={m.current} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PatientDetails() {
  const router = useRouter();
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
        <div className="grid gap-3 sm:grid-cols-3">
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

  const meds = user.medications || [];
  const currentMeds = meds.filter((m) => m.current);
  const pastMeds = meds.filter((m) => !m.current);
  const purchases = user.purchases || [];
  const totalSpent = purchases.reduce((s, p) => s + (p.totalPurchase || 0), 0);
  const patientAge = age(user.dateOfBirth);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/user">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {initials(user.fullName)}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {user.fullName}
            </h1>
            <p className="text-sm capitalize text-muted-foreground">
              {[
                user.gender,
                patientAge !== null && `${patientAge} yrs`,
                user.dateOfBirth && `born ${shortDate(user.dateOfBirth)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/dashboard/user/edit/${id}`}>
            <Pencil className="h-4 w-4" /> Edit patient
          </Link>
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-3">
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
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
        {/* Contact card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="truncate font-medium">
                  {user.phoneNumber || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate font-medium">{user.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Cake className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p className="truncate font-medium">
                  {shortDate(user.dateOfBirth)}
                </p>
              </div>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Registered {shortDate(user.createdAt)}
            </p>
          </CardContent>
        </Card>

        {/* Medications + purchases */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current medications</CardTitle>
              <CardDescription>
                What this patient is on right now
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {currentMeds.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No active medications.
                </p>
              ) : (
                <MedTable meds={currentMeds} />
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
                              {(p.medications || []).map((m, i) => (
                                <span
                                  key={m._id || i}
                                  className="rounded-full border bg-background px-2.5 py-1 text-xs"
                                >
                                  {m.medication?.nameOfDrugs || "(deleted)"} ×{" "}
                                  {m.quantity}
                                </span>
                              ))}
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
