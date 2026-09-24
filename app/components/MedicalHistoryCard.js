"use client";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export const EMPTY_MEDICAL_HISTORY = {
  conditions: [],
  allergies: [],
  pregnancyStatus: "unknown",
  weightKg: "",
  notes: "",
};

// Build the payload the API expects from the card's state
export const toMedicalHistoryPayload = (mh, gender) => ({
  conditions: mh.conditions,
  allergies: mh.allergies,
  pregnancyStatus: gender === "female" ? mh.pregnancyStatus : "not_applicable",
  // null (not undefined) so an emptied weight is actually cleared on edit
  weightKg:
    mh.weightKg === "" || mh.weightKg == null ? null : Number(mh.weightKg),
  notes: mh.notes.trim(),
});

const ALLERGY_SUGGESTIONS = [
  "Penicillin",
  "Sulfonamides",
  "NSAIDs",
  "Aspirin",
  "Chloroquine",
  "Codeine",
];

const CONDITION_SUGGESTIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Peptic ulcer",
  "Sickle cell disease",
  "Chronic kidney disease",
  "Liver disease",
  "Heart failure",
  "Epilepsy",
];

const NOTES_MAX = 4000;

/* ── Tag input: type and press Enter/comma, or tap a suggestion ───────── */
function TagField({
  id,
  label,
  placeholder,
  values,
  onChange,
  suggestions,
  danger,
}) {
  const [draft, setDraft] = useState("");

  const has = (item) =>
    values.some((v) => v.toLowerCase() === item.toLowerCase());

  const add = (raw) => {
    const item = raw.replace(/,/g, "").trim();
    setDraft("");
    if (!item || has(item)) return;
    onChange([...values, item]);
  };

  const remove = (item) => onChange(values.filter((v) => v !== item));

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      remove(values[values.length - 1]);
    }
  };

  // Android keyboards often don't report "," in keydown, so catch it here
  const onInput = (e) => {
    const v = e.target.value;
    if (v.endsWith(",")) add(v);
    else setDraft(v);
  };

  const chip = danger
    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    : "border-border bg-muted text-foreground";

  const unused = suggestions.filter((s) => !has(s));

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-1.5">
        <Input
          id={id}
          value={draft}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          enterKeyHint="done"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => add(draft)}
          disabled={!draft.trim()}
          aria-label={`Add to ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 rounded-full border py-1 pl-2.5 pr-1.5 text-xs font-medium ${chip}`}
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label={`Remove ${v}`}
                className="rounded-full p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.slice(0, 6).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => add(s)}
              className="rounded-full border border-dashed px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */
export default function MedicalHistoryCard({ value, onChange, gender }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const isFemale = gender === "female";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Medical history</CardTitle>
        <CardDescription>
          The AI checks every dispense against this record
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <TagField
          id="allergies"
          label="Allergies"
          placeholder="e.g. Penicillin"
          values={value.allergies}
          onChange={(allergies) => set({ allergies })}
          suggestions={ALLERGY_SUGGESTIONS}
          danger
        />

        <TagField
          id="conditions"
          label="Conditions"
          placeholder="e.g. Hypertension"
          values={value.conditions}
          onChange={(conditions) => set({ conditions })}
          suggestions={CONDITION_SUGGESTIONS}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={value.weightKg}
              onChange={(e) => set({ weightKg: e.target.value })}
              placeholder="Optional"
            />
          </div>
          {isFemale && (
            <div className="grid gap-1.5">
              <Label>Pregnancy</Label>
              <Select
                value={value.pregnancyStatus}
                onValueChange={(v) => set({ pregnancyStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="not_pregnant">Not pregnant</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                  <SelectItem value="breastfeeding">Breastfeeding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="notes">Medical record notes</Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {value.notes.length}/{NOTES_MAX}
            </span>
          </div>
          <textarea
            id="notes"
            rows={5}
            maxLength={NOTES_MAX}
            value={value.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Past diagnoses, surgeries, recent lab results (eGFR, LFTs), previous drug reactions, doctor's notes"
            className="min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </CardContent>
    </Card>
  );
}
