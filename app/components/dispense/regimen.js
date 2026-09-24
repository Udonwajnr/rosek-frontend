// Shared helpers for the dose / frequency / duration of each basket item.
// Used by the Dispense page and the Assistant sidebar.

export const DOSE_UNITS = ["mg", "ml", "mcg", "g"];

export const FREQUENCIES = [
  { code: "OD", label: "Once daily (OD)", perDay: 1 },
  { code: "BD", label: "Twice daily (BD)", perDay: 2 },
  { code: "TDS", label: "Three times daily (TDS)", perDay: 3 },
  { code: "QDS", label: "Four times daily (QDS)", perDay: 4 },
  { code: "Q4H", label: "Every 4 hours", perDay: 6 },
  { code: "NOCTE", label: "At night (nocte)", perDay: 1 },
  { code: "WEEKLY", label: "Once weekly", perDay: null },
  { code: "PRN", label: "When needed (PRN)", perDay: null },
  { code: "STAT", label: "Single dose (STAT)", perDay: null },
];

export const DURATION_UNITS = ["days", "weeks", "months"];

const findFrequency = (code) => FREQUENCIES.find((f) => f.code === code);

// "500mg" -> { value: 500, unit: "mg" }, "5mg/5ml" -> { value: 5, unit: "mg" }
export const parseStrength = (dosage) => {
  const match = String(dosage || "").match(/([\d.]+)\s*(mcg|µg|mg|g|ml)\b/i);
  if (!match) return null;
  let unit = match[2].toLowerCase();
  if (unit === "µg") unit = "mcg";
  return { value: Number(match[1]), unit };
};

// Inventory stores frequency as "every N hours/days"; map it to a code
const inventoryFrequencyToCode = (freq) => {
  if (!freq?.value || !freq?.unit) return "";
  const hours = freq.unit === "days" ? freq.value * 24 : freq.value;
  const map = { 4: "Q4H", 6: "QDS", 8: "TDS", 12: "BD", 24: "OD", 168: "WEEKLY" };
  return map[hours] || "";
};

// Prefill the regimen from the medication's defaults so the pharmacist only adjusts
export const defaultRegimen = (med) => {
  const strength = parseStrength(med.dosage);
  const perIntake = Number(med.dosageAmount) || 1;
  return {
    doseValue: strength ? String(+(strength.value * perIntake).toFixed(3)) : "",
    doseUnit: strength?.unit || "mg",
    frequency: inventoryFrequencyToCode(med.frequency),
    durationValue: med.duration?.value ? String(med.duration.value) : "",
    durationUnit: DURATION_UNITS.includes(med.duration?.unit)
      ? med.duration.unit
      : "days",
  };
};

// "3,000 mg" per day, or null when it can't be worked out (PRN, STAT, weekly)
export const dailyTotal = (item) => {
  const perDay = findFrequency(item.frequency)?.perDay;
  const dose = Number(item.doseValue);
  if (!perDay || !(dose > 0)) return null;
  return `${(dose * perDay).toLocaleString()} ${item.doseUnit}`;
};

export const isRegimenComplete = (item) =>
  Number(item.doseValue) > 0 &&
  !!item.frequency &&
  (item.frequency === "STAT" || Number(item.durationValue) > 0);

// What the AI sees for each basket item
export const toAIBasketItem = (item) => {
  const freq = findFrequency(item.frequency);
  return {
    name: item.name,
    dosage: item.dosage,
    dose: Number(item.doseValue) > 0 ? `${item.doseValue} ${item.doseUnit}` : undefined,
    frequency: freq ? freq.label : undefined,
    dailyTotal: dailyTotal(item) || undefined,
    duration:
      Number(item.durationValue) > 0
        ? `${item.durationValue} ${item.durationUnit}`
        : undefined,
  };
};

// What gets saved with the dispense
export const toRegimenPayload = (item) => {
  const freq = findFrequency(item.frequency);
  return {
    dose: { value: Number(item.doseValue), unit: item.doseUnit },
    frequency: freq
      ? { code: freq.code, label: freq.label, timesPerDay: freq.perDay }
      : undefined,
    duration:
      Number(item.durationValue) > 0
        ? { value: Number(item.durationValue), unit: item.durationUnit }
        : undefined,
  };
};