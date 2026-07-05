"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import api from "../../axios/axiosConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Users } from "lucide-react";

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

export default function PatientsPage() {
  const [patients, setPatients] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const hospitalId = localStorage.getItem("_id");
    if (!hospitalId) return;
    api
      .get(`/api/user/hospital/${hospitalId}/users`)
      .then((res) => setPatients(res.data || []))
      .catch(() => setPatients([]));
  }, []);

  const rows = useMemo(() => {
    if (!patients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.phoneNumber?.includes(q) ||
        p.email?.toLowerCase().includes(q),
    );
  }, [patients, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {patients ? `${patients.length} on record` : "Loading…"}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/user/create">
            <Plus className="h-4 w-4" /> New patient
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, or email…"
                className="pl-9"
              />
            </div>
          </div>

          {!patients ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Users className="h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {query ? "No patients match your search." : "No patients yet."}
              </p>
              {!query && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/dashboard/user/create">
                    <Plus className="h-3.5 w-3.5" /> Add your first patient
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rosek-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Patient</th>
                    <th className="px-4 py-3 font-semibold">Age</th>
                    <th className="px-4 py-3 font-semibold">Gender</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Active meds</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((p) => {
                    const activeMeds =
                      p.medications?.filter((m) => m.current)?.length || 0;
                    return (
                      <tr
                        key={p._id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/user/${p._id}`}
                            className="flex items-center gap-3"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials(p.fullName)}
                            </span>
                            <span>
                              <span className="block font-medium hover:underline">
                                {p.fullName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {p.email || "No email"}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {age(p.dateOfBirth) ?? "—"}
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">
                          {p.gender}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.phoneNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {activeMeds > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                              {activeMeds} active
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${p.fullName}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/user/${p._id}`}>
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/user/edit/${p._id}`}>
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/user/delete/${p._id}`}
                                  className="text-destructive"
                                >
                                  Delete
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
