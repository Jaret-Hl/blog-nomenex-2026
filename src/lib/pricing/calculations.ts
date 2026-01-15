import type { Tabulator } from "./types";

// calcular el costo del paquete basado en el tabulador y el número de empleados
export function calculatePackageCost(
  tab: Tabulator | null,
  employees: number
): number {
  if (!tab) return 0;

  if (tab.tipo === "mensual") {
    return tab.precio;
  }

  // unitario
  return tab.precio * employees;
}

// Biometric pricing constants
const BIOMETRIC_PRICES = {
  basic: 4258.80,
  advanced: 5500,// se pueden considerar otros tipos en el futuro
  terminal: 7500,
} as const;

const INSTALLATION_PRICE = 0; // se establece en 0 para que después pueda ajustarse fácilmente si es necesario

export function calculateBiometricsCost(
  required: boolean,
  count: number,
  type: keyof typeof BIOMETRIC_PRICES // se pone keyof con typeof para mayor seguridad
): number {
  if (!required || count <= 0) return 0;

  // Validar que el tipo sea válido, usar 'basic' por defecto
  const validType = type in BIOMETRIC_PRICES ? type : "basic";

  const deviceCost = BIOMETRIC_PRICES[validType];
  const totalCost = (deviceCost + INSTALLATION_PRICE) * count;

  return totalCost;
}
