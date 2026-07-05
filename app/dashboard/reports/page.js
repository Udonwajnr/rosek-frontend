"use client";
import { useState, useEffect } from "react";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  Wallet,
  TrendingUp,
  History,
  Boxes,
  AlertTriangle,
} from "lucide-react";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const dateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

async function downloadCSV(url, filename) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    toast.error("Could not download the CSV");
  }
}

function StatCard({ icon: Icon, label, value, tone = "" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`truncate text-lg font-bold tabular-nums ${tone}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [hospitalId, setHospitalId] = useState("");

  const [valuation, setValuation] = useState(null);
  const [fastDays, setFastDays] = useState("30");
  const [fastMoving, setFastMoving] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const hid = localStorage.getItem("_id");
    setHospitalId(hid);
    if (!hid) return;
    api
      .get(`/api/report/${hid}/valuation`)
      .then((res) => setValuation(res.data))
      .catch(() => setValuation({ rows: [], totals: {} }));
    api
      .get(`/api/report/${hid}/dispense-history?limit=50`)
      .then((res) => setHistory(res.data.movements || []))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (!hospitalId) return;
    setFastMoving(null);
    api
      .get(`/api/report/${hospitalId}/fast-moving?days=${fastDays}`)
      .then((res) => setFastMoving(res.data.rows || []))
      .catch(() => setFastMoving([]));
  }, [hospitalId, fastDays]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          What your stock is worth, what moves fastest, and where it all went
        </p>
      </div>

      {/* Valuation stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {valuation === null ? (
          <>
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </>
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Retail value"
              value={naira(valuation.totals?.totalRetailValue)}
            />
            <StatCard
              icon={Wallet}
              label="Cost value (batches)"
              value={naira(valuation.totals?.totalCostValue)}
            />
            <StatCard
              icon={Boxes}
              label="Units on hand"
              value={(valuation.totals?.totalUnits || 0).toLocaleString()}
            />
            <StatCard
              icon={AlertTriangle}
              label="Low-stock items"
              value={valuation.totals?.lowStockCount || 0}
              tone={valuation.totals?.lowStockCount > 0 ? "text-amber-600" : ""}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="valuation">
        <TabsList>
          <TabsTrigger value="valuation" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Valuation
          </TabsTrigger>
          <TabsTrigger value="fast" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Fast moving
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Dispense history
          </TabsTrigger>
        </TabsList>

        {/* Valuation */}
        <TabsContent value="valuation" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                downloadCSV(
                  `/api/report/${hospitalId}/valuation?format=csv`,
                  "stock-valuation.csv"
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {valuation === null ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Drug</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Retail value
                        </th>
                        <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                          Cost value
                        </th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuation.rows.map((r) => (
                        <tr
                          key={r.medicationId}
                          className="border-b last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium">{r.nameOfDrugs}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.dosage} · {r.dosageForm}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {r.quantityInStock}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {naira(r.sellingPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {naira(r.retailValue)}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                            {r.costValue ? naira(r.costValue) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {r.lowStock ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Low
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fast moving */}
        <TabsContent value="fast" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Select value={fastDays} onValueChange={setFastDays}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                downloadCSV(
                  `/api/report/${hospitalId}/fast-moving?days=${fastDays}&format=csv`,
                  `fast-moving-${fastDays}d.csv`
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {fastMoving === null ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : fastMoving.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    No dispensing recorded in this window
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Once medications are dispensed, the fastest movers show up here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">Drug</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Units dispensed
                        </th>
                        <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                          Events
                        </th>
                        <th className="px-4 py-3 text-right font-medium">Revenue</th>
                        <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                          In stock now
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fastMoving.map((r, i) => (
                        <tr
                          key={r.medicationId}
                          className="border-b last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{r.nameOfDrugs}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.dosage} · {r.dosageForm}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {r.unitsDispensed}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                            {r.dispenseEvents}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {naira(r.revenue)}
                          </td>
                          <td
                            className={`hidden px-4 py-3 text-right tabular-nums md:table-cell ${
                              r.currentStock <= 0 ? "font-semibold text-red-500" : ""
                            }`}
                          >
                            {r.currentStock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispense history */}
        <TabsContent value="history" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                downloadCSV(
                  `/api/report/${hospitalId}/dispense-history?format=csv`,
                  "dispense-history.csv"
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {history === null ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <History className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No dispensing yet</p>
                  <p className="text-sm text-muted-foreground">
                    Dispensed medications — purchases and patient assignments — appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">When</th>
                        <th className="px-4 py-3 font-medium">Drug</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="hidden px-4 py-3 font-medium sm:table-cell">
                          Batch
                        </th>
                        <th className="hidden px-4 py-3 font-medium md:table-cell">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((m) => (
                        <tr
                          key={m._id}
                          className="border-b last:border-0 hover:bg-muted/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {dateTime(m.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {m.medication?.nameOfDrugs || "(deleted)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.medication?.dosage}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {Math.abs(m.quantityChange)}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {m.batch?.batchNumber || "—"}
                          </td>
                          <td className="hidden max-w-[280px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                            {m.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
