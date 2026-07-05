"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HeartPulse, Menu, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Motion helpers (no packages — scroll/mouse listeners + IO)         */
/* ------------------------------------------------------------------ */

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Fade-and-rise on scroll into view. Usage: <Reveal delay={100}>...</Reveal> */
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Returns a ref + scroll progress (px scrolled) for parallax layers */
export function useScrollY() {
  const [y, setY] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);
  return y;
}

/* ------------------------------------------------------------------ */
/*  Signature SVG: ECG pulse line                                      */
/* ------------------------------------------------------------------ */

export function PulseLine({ className = "" }) {
  return (
    <svg
      viewBox="0 0 600 60"
      fill="none"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M0 30 H180 L200 30 L215 8 L232 52 L246 22 L258 30 H370 L385 30 L398 14 L412 46 L424 30 H600"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rosek-pulse-path"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav + Footer                                                       */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: "/#features", label: "Product" },
  { href: "/#flow", label: "How it works" },
  { href: "/about", label: "About" },
  // { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b bg-background/85 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Rosek</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>

        {/* Mobile */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-b bg-background/95 px-4 pb-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HeartPulse className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Rosek</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Pharmacy operations for hospitals and clinics — stock you can
              trust, patients who take their medication on time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Product
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href="/#features" className="text-muted-foreground hover:text-foreground">
                  Features
                </Link>
                <Link href="/#flow" className="text-muted-foreground hover:text-foreground">
                  How it works
                </Link>
                <Link href="/register" className="text-muted-foreground hover:text-foreground">
                  Get started
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Company
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Rosek. Built in Lagos, Nigeria.</p>
          <p className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}