"use client";
import { useState, useEffect } from "react";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CalendarClock, Trash2, Loader2, ShieldAlert } from "lucide-react";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const daysUntil = (d) =>
  Math.ceil((new Date(d) - new Date()) / (24 * 60 * 60 * 1000));

const BUCKETS = [
  { key: "expired", label: "Expired", tone: "text-red-600" },
  { key: "within30", label: "≤ 30 days", tone: "text-amber-600" },
  { key: "within60", label: "31–60 days", tone: "text-yellow-600" },
  { key: "within90", label: "61–90 days", tone: "text-muted-foreground" },
];

export default function ExpiryPage() {
  const [hospitalId, setHospitalId] = useState("");
  const [data, setData] = useState(null);

  const [writeOffTarget, setWriteOffTarget] = useState(null); // batch
  const [reason, setReason] = useState("");
  const [type, setType] = useState("expired");
  const [submitting, setSubmitting] = useState(false);

  const load = (hid) =>
    api
      .get(`/api/stock/${hid}/expiry`)
      .then((res) => setData(res.data))
      .catch(() => setData({ batches: {}, legacyMedications: {} }));

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (hid) load(hid);
  }, []);

  const submitWriteOff = async () => {
    if (!reason.trim())
      return toast.error("A reason is required — it goes on the ledger");
    setSubmitting(true);
    try {
      await api.post(
        `/api/stock/${hospitalId}/batches/${writeOffTarget._id}/write-off`,
        { reason: reason.trim(), type }
      );
      toast.success(
        `Batch ${writeOffTarget.batchNumber} written off — stock updated`
      );
      setWriteOffTarget(null);
      setReason("");
      load(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Write-off failed");
    } finally {
      setSubmitting(false);
    }
  };

  const bucketCount = (key) =>
    (data?.batches?.[key]?.length || 0) + (data?.legacyMedications?.[key]?.length || 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Expiry management</h1>
        <p className="text-sm text-muted-foreground">
          What's expiring in the next 90 days — write off what's already gone
        </p>
      </div>

      {data === null ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-[380px]" />
        </div>
      ) : (
        <Tabs defaultValue={bucketCount("expired") > 0 ? "expired" : "within30"}>
          <TabsList>
            {BUCKETS.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="gap-1.5">
                {b.label}
                <span
                  className={`rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums ${
                    bucketCount(b.key) > 0 ? b.tone : ""
                  }`}
                >
                  {bucketCount(b.key)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {BUCKETS.map((b) => {
            const batches = data.batches?.[b.key] || [];
            const legacy = data.legacyMedications?.[b.key] || [];
            return (
              <TabsContent key={b.key} value={b.key} className="mt-4">
                {batches.length === 0 && legacy.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                      <CalendarClock className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Nothing {b.key === "expired" ? "expired" : `expiring ${b.label}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You're clear in this window.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="px-4 py-3 font-medium">Medication</th>
                              <th className="px-4 py-3 font-medium">Batch</th>
                              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                                Supplier
                              </th>
                              <th className="px-4 py-3 text-right font-medium">
                                Units
                              </th>
                              <th className="px-4 py-3 font-medium">Expiry</th>
                              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                                Value at risk
                              </th>
                              <th className="w-12 px-4 py-3" />
                            </tr>
                          </thead>
                          <tbody>
                            {batches.map((batch) => {
                              const d = daysUntil(batch.expiryDate);
                              return (
                                <tr
                                  key={batch._id}
                                  className="border-b last:border-0 hover:bg-muted/40"
                                >
                                  <td className="px-4 py-3">
                                    <p className="font-medium">
                                      {batch.medication?.nameOfDrugs}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {batch.medication?.dosage} ·{" "}
                                      {batch.medication?.dosageForm}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">{batch.batchNumber}</td>
                                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                    {batch.supplier?.name || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums">
                                    {batch.quantityRemaining}
                                  </td>
                                  <td className="px-4 py-3">
                                    <p>{shortDate(batch.expiryDate)}</p>
                                    <p
                                      className={`text-xs ${
                                        d < 0
                                          ? "font-semibold text-red-500"
                                          : d <= 30
                                            ? "text-amber-600"
                                            : "text-muted-foreground"
                                      }`}
                                    >
                                      {d < 0
                                        ? `${Math.abs(d)} days ago`
                                        : `in ${d} days`}
                                    </p>
                                  </td>
                                  <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">
                                    {naira(
                                      batch.quantityRemaining *
                                        (batch.medication?.price || 0)
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setWriteOffTarget(batch);
                                        setType(d < 0 ? "expired" : "damaged");
                                        setReason(
                                          d < 0
                                            ? `Expired ${shortDate(batch.expiryDate)}`
                                            : ""
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" /> Write off
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {legacy.length > 0 && (
                        <div className="border-t bg-muted/30 px-4 py-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Un-batched stock in this window — expiry comes from the
                            item itself, use Adjust on the ledger to write off
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {legacy.map((m) => (
                              <span
                                key={m._id}
                                className="rounded-full border bg-background px-2.5 py-1 text-xs"
                              >
                                {m.nameOfDrugs} · {m.quantityInStock} units ·{" "}
                                {shortDate(m.expiryDate)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Write-off sheet */}
      <Sheet
        open={!!writeOffTarget}
        onOpenChange={(open) => !open && setWriteOffTarget(null)}
      >
        <SheetContent className="flex w-full flex-col gap-5 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Write off batch {writeOffTarget?.batchNumber}
            </SheetTitle>
            <SheetDescription>
              Removes {writeOffTarget?.quantityRemaining} units of{" "}
              {writeOffTarget?.medication?.nameOfDrugs} from stock. This is recorded
              in the ledger and can't be undone.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Write-off type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (required)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Past expiry, removed from shelf 4 Jul"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setWriteOffTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitWriteOff}
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Write off batch
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
