"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  Sparkles,
  Boxes,
  CalendarClock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI dispensing assistant",
    text: "Drug interactions are checked live as you type — against the basket and the patient's own medication history. Only critical risks surface.",
  },
  {
    icon: Boxes,
    title: "Inventory that stays honest",
    text: "Stock counts update on every dispense, with reorder-level and expiry alerts before you run out or waste a batch.",
  },
  {
    icon: CalendarClock,
    title: "Schedules patients actually follow",
    text: "Every dispense emails the patient a calendar file with a reminder for each dose — no app to install.",
  },
  {
    icon: ShieldAlert,
    title: "A silent safety log",
    text: "Minor interactions are recorded quietly instead of interrupting you, so there's an audit trail without alert fatigue.",
  },
];

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("accessToken")));
    // Wake the Render backend so login feels instant
    axios.get("https://medical-api-advo.onrender.com").catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Rosek</span>
        </Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Built for pharmacies and clinics in Nigeria
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Dispense with confidence.
            <span className="block text-primary">
              Your AI checks every combination.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Rosek manages your medication inventory, patients, and dispensing —
            with a clinical assistant that flags dangerous drug interactions the
            moment you start typing.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href={loggedIn ? "/dashboard" : "/register"}>
                {loggedIn ? "Open dashboard" : "Create your pharmacy account"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!loggedIn && (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </div>

          {/* Product hint — a mini mock of the live check */}
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border bg-card p-4 text-left shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Dispensing basket · Chief E. Nwosu, 74
            </p>
            <div className="mt-2 rounded-lg border px-3 py-2 text-sm">
              Warfarin{" "}
              <span className="text-xs text-muted-foreground">
                5mg · Tablet
              </span>
            </div>
            <div className="mt-2 rounded-lg border border-red-300 border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm dark:bg-red-950/40">
              Ibuprofen{" "}
              <span className="text-xs text-muted-foreground">
                400mg · Tablet
              </span>
              <p className="mt-1 text-xs leading-relaxed text-red-800 dark:text-red-300">
                Heads up: this combination increases bleeding risk —
                double-check before dispensing.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Rosek — medication management for
            modern pharmacies.
          </span>
          <span>Built by U3Dev Labs</span>
        </div>
      </footer>
    </div>
  );
}
