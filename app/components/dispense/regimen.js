// Dosing helpers for the dispensing basket.
//
// Uses the SAME shape as the Medication model in the backend:
//   frequency: { value, unit: "hours" | "days" }   e.g. every 8 hours
//   duration:  { value, unit: "days" | "weeks" }   e.g. for 5 days
// Plus the dose per intake:
//   dose:      { value, unit: "mg" | "ml" }        e.g. 1000 mg
//
// In the basket each item keeps these as simple form fields:
//   doseValue, doseUnit, frequencyValue, frequencyUnit, durationValue, durationUnit

export const DOSE_UNITS = ["mg", "ml"];
export const FREQUENCY_UNITS = ["hours", "days"]; // same enum as Medication.frequency.unit
export const DURATION_UNITS = ["days", "weeks"]; // same enum as Medication.duration.unit

// "500mg" -> { value: 500, unit: "mg" },  "5mg/5ml" -> { value: 5, unit: "mg" }
const parseStrength = (dosage) => {
  const match = String(dosage || "").match(/([\d.]+)\s*(mg|ml)\b/i);
  return match
    ? { value: Number(match[1]), unit: match[2].toLowerCase() }
    : null;
};

// Prefill from the medication's own defaults so the pharmacist only adjusts.
// Dose = strength x dosageAmount, e.g. Paracetamol 500mg x 2 tablets = 1000 mg
export const defaultRegimen = (med) => {
  const strength = parseStrength(med.dosage);
  const perIntake = Number(med.dosageAmount) || 1;
  return {
    doseValue: strength ? String(strength.value * perIntake) : "",
    doseUnit: strength?.unit || "mg",
    frequencyValue: med.frequency?.value ? String(med.frequency.value) : "",
    frequencyUnit: FREQUENCY_UNITS.includes(med.frequency?.unit)
      ? med.frequency.unit
      : "hours",
    durationValue: med.duration?.value ? String(med.duration.value) : "",
    durationUnit: DURATION_UNITS.includes(med.duration?.unit)
      ? med.duration.unit
      : "days",
  };
};

// How many times a day: every 8 hours -> 3, every 1 day -> 1
const timesPerDay = (item) => {
  const every = Number(item.frequencyValue);
  if (!(every > 0)) return null;
  return item.frequencyUnit === "hours" ? 24 / every : 1 / every;
};

// "3 times a day", "once a day", or null when it isn't a whole number
export const timesPerDayLabel = (item) => {
  const t = timesPerDay(item);
  if (!t || !Number.isInteger(t)) return null;
  return t === 1 ? "once a day" : `${t} times a day`;
};

// "every 8 hours (3 times a day)"
export const describeFrequency = (item) => {
  const every = Number(item.frequencyValue);
  if (!(every > 0)) return undefined;
  const unit =
    every === 1 ? item.frequencyUnit.slice(0, -1) : item.frequencyUnit;
  const perDay = timesPerDayLabel(item);
  return `every ${every} ${unit}${perDay ? ` (${perDay})` : ""}`;
};

// "3,000 mg" per day, or null when it can't be worked out
export const dailyTotal = (item) => {
  const t = timesPerDay(item);
  const dose = Number(item.doseValue);
  if (!t || !Number.isInteger(t) || !(dose > 0)) return null;
  return `${(dose * t).toLocaleString()} ${item.doseUnit}`;
};

export const isRegimenComplete = (item) =>
  Number(item.doseValue) > 0 &&
  Number(item.frequencyValue) > 0 &&
  Number(item.durationValue) > 0;

// What the AI sees for each basket item (plain text, backend unchanged)
export const toAIBasketItem = (item) => ({
  name: item.name,
  dosage: item.dosage,
  dose:
    Number(item.doseValue) > 0
      ? `${item.doseValue} ${item.doseUnit}`
      : undefined,
  frequency: describeFrequency(item),
  dailyTotal: dailyTotal(item) || undefined,
  duration:
    Number(item.durationValue) > 0
      ? `${item.durationValue} ${item.durationUnit}`
      : undefined,
});

// What gets sent with the dispense, in the Medication model's shape
export const toRegimenPayload = (item) => ({
  dose: { value: Number(item.doseValue), unit: item.doseUnit },
  frequency: { value: Number(item.frequencyValue), unit: item.frequencyUnit },
  duration: { value: Number(item.durationValue), unit: item.durationUnit },
});
