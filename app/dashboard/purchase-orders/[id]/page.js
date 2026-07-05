"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  PackageCheck,
  Truck,
  CalendarClock,
  StickyNote,
} from "lucide-react";
import { StatusPill } from "../page";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function PurchaseOrderDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [hospitalId, setHospitalId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Receiving state: per item — quantityReceived, batchNumber, expiryDate, costPrice
  const [receiving, setReceiving] = useState(false);
  const [receiveRows, setReceiveRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = (hid) =>
    api
      .get(`/api/purchase-order/${hid}/${id}`)
      .then((res) => {
        setOrder(res.data);
        setReceiveRows(
          (res.data.items || []).map((it) => ({
            itemId: it._id,
            quantityReceived: it.quantityOrdered,
            batchNumber: "",
            expiryDate: "",
            costPrice: it.costPrice ?? "",
          }))
        );
      })
      .catch(() => {
        toast.error("Could not load this order");
        router.push("/dashboard/purchase-orders");
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (hid && id) load(hid);
  }, [id]);

  const updateRow = (i, patch) =>
    setReceiveRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );

  const setStatus = async (status) => {
    try {
      await api.put(`/api/purchase-order/${hospitalId}/${id}`, { status });
      toast.success(`Order marked as ${status}`);
      load(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update the order");
    }
  };

  const submitReceive = async () => {
    for (const r of receiveRows) {
      if (!r.quantityReceived || Number(r.quantityReceived) < 1)
        return toast.error("Every item needs a received quantity of at least 1");
      if (!r.batchNumber.trim())
        return toast.error("Every item needs a batch number");
      if (!r.expiryDate) return toast.error("Every item needs an expiry date");
    }
    setSubmitting(true);
    try {
      await api.post(`/api/purchase-order/${hospitalId}/${id}/receive`, {
        items: receiveRows.map((r) => ({
          itemId: r.itemId,
          quantityReceived: Number(r.quantityReceived),
          batchNumber: r.batchNumber.trim(),
          expiryDate: r.expiryDate,
          costPrice: r.costPrice === "" ? undefined : Number(r.costPrice),
        })),
      });
      toast.success("Stock received — batches created and inventory updated");
      setReceiving(false);
      load(hospitalId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Receiving failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  const total = (order.items || []).reduce(
    (s, i) => s + (i.costPrice || 0) * (i.quantityOrdered || 0),
    0
  );
  const canReceive = ["draft", "ordered"].includes(order.status);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {order.orderNumber}
              </h1>
              <StatusPill status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {shortDate(order.createdAt)}
              {order.receivedAt && ` · received ${shortDate(order.receivedAt)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === "draft" && (
            <Button variant="outline" onClick={() => setStatus("ordered")}>
              Mark as ordered
            </Button>
          )}
          {canReceive && !receiving && (
            <Button onClick={() => setReceiving(true)} className="gap-2">
              <PackageCheck className="h-4 w-4" /> Receive stock
            </Button>
          )}
          {canReceive && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setStatus("cancelled")}
            >
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        {/* Items / receive form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {receiving ? "Receive items into batches" : "Items"}
            </CardTitle>
            {receiving && (
              <CardDescription>
                Each item becomes a batch — enter the batch number and expiry from
                the physical stock you received
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {(order.items || []).map((it, idx) => (
              <div key={it._id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {it.medication?.nameOfDrugs || "(deleted drug)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {it.medication?.dosage} · ordered {it.quantityOrdered} @{" "}
                      {naira(it.costPrice)}/unit
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {naira((it.costPrice || 0) * (it.quantityOrdered || 0))}
                  </p>
                </div>

                {order.status === "received" && it.batch && (
                  <p className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Received {it.quantityReceived} into batch{" "}
                    <span className="font-semibold">{it.batch.batchNumber}</span>
                    {it.batch.expiryDate &&
                      ` · expires ${shortDate(it.batch.expiryDate)}`}
                  </p>
                )}

                {receiving && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Qty received
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-8"
                        value={receiveRows[idx]?.quantityReceived ?? ""}
                        onChange={(e) =>
                          updateRow(idx, { quantityReceived: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Batch no.
                      </Label>
                      <Input
                        className="h-8"
                        placeholder="e.g. AMX-0426"
                        value={receiveRows[idx]?.batchNumber ?? ""}
                        onChange={(e) =>
                          updateRow(idx, { batchNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Expiry</Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={receiveRows[idx]?.expiryDate ?? ""}
                        onChange={(e) =>
                          updateRow(idx, { expiryDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Cost / unit (₦)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8"
                        value={receiveRows[idx]?.costPrice ?? ""}
                        onChange={(e) =>
                          updateRow(idx, { costPrice: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {receiving && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setReceiving(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReceive} disabled={submitting} className="gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackageCheck className="h-4 w-4" />
                  )}
                  Confirm receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" /> Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.supplier?.name}</p>
              {order.supplier?.contactPerson && (
                <p className="text-muted-foreground">{order.supplier.contactPerson}</p>
              )}
              {order.supplier?.phone && (
                <p className="text-muted-foreground">{order.supplier.phone}</p>
              )}
              {order.supplier?.email && (
                <p className="text-muted-foreground">{order.supplier.email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium tabular-nums">
                  {order.items?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order total</span>
                <span className="font-bold tabular-nums">{naira(total)}</span>
              </div>
              {order.expectedDate && (
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> Expected
                  </span>
                  <span className="font-medium">{shortDate(order.expectedDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4 text-primary" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
