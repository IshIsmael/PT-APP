// Tola stores everything canonically in metric (kg / cm / ml). These helpers
// convert to/from the user's display units. unit_preference drives which to show.

export type Units = 'metric' | 'imperial';

export const kgToLb = (kg: number) => kg * 2.2046226218;
export const lbToKg = (lb: number) => lb / 2.2046226218;

export const cmToInch = (cm: number) => cm / 2.54;
export const inchToCm = (inch: number) => inch * 2.54;

// Height in imperial is feet + inches.
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInch(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchToCm(feet * 12 + inches);
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
