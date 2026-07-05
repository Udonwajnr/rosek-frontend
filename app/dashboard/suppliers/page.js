"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  MoreHorizontal,
  Truck,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function SuppliersPage() {
  const [hospitalId, setHospitalId] = useState("");
  const [suppliers, setSuppliers] = useState(null);
  const [query, setQuery] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null); // supplier being edited, or null = create
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = (hid) =>
    api
      .get(`/api/supplier/${hid}`)
      .then((res) => setSuppliers(res.data || []))
      .catch(() => setSuppliers([]));

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (hid) load(hid);
  }, []);

  const filtered = useMemo(() => {
    if (!suppliers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [suppliers, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setSheetOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name || "",
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      notes: s.notes || "",
    });
    setSheetOpen(true);
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Supplier name is required");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/supplier/${hospitalId}/${editing._id}`, form);
        toast.success(`${form.name} updated`);
      } else {
        await api.post(`/api/supplier/${hospitalId}`, form);
        toast.success(`${form.name} added`);
      }
      setSheetOpen(false);
      load(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save the supplier");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/api/supplier/${hospitalId}/${s._id}`, {
        isActive: !s.isActive,
      });
      toast.success(`${s.name} ${s.isActive ? "deactivated" : "reactivated"}`);
      load(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update the supplier");
    }
  };

  const remove = async (s) => {
    try {
      await api.delete(`/api/supplier/${hospitalId}/${s._id}`);
      toast.success(`${s.name} deleted`);
      load(hospitalId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not delete the supplier"
      );
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Who your stock comes from — the base of every batch and purchase order
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, contact, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {suppliers === null ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Truck className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {query ? "No suppliers match your search" : "No suppliers yet"}
              </p>
              {!query && (
                <p className="text-sm text-muted-foreground">
                  Add your first supplier to start tracking where stock comes from.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">
                      Address
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{s.name}</p>
                        {s.contactPerson && (
                          <p className="text-xs text-muted-foreground">
                            {s.contactPerson}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {s.phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> {s.phone}
                            </span>
                          )}
                          {s.email && (
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {s.email}
                            </span>
                          )}
                          {!s.phone && !s.email && "—"}
                        </div>
                      </td>
                      <td className="hidden max-w-[240px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                        {s.address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(s)}>
                              {s.isActive ? "Deactivate" : "Reactivate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => remove(s)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-5 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${editing.name}` : "Add supplier"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update this supplier's details"
                : "New source for your stock and purchase orders"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Company name</Label>
              <Input
                id="s-name"
                placeholder="e.g. Kunle Pharma Ltd"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-contact">Contact person</Label>
              <Input
                id="s-contact"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">Phone</Label>
                <Input
                  id="s-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-email">Email</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-address">Address</Label>
              <Input
                id="s-address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-notes">Notes</Label>
              <Textarea
                id="s-notes"
                rows={3}
                placeholder="Lead times, payment terms…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add supplier"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
