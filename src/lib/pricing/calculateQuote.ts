import packages from "@/data/paquetes.json";
import type { WizardState, Package } from "./types";
import { resolvePackage, resolveTabulator } from "./resolvers";
import { calculatePackageCost, calculateBiometricsCost } from "./calculations";

export function calculateQuote(state: WizardState) {
  const employees = state.step1?.employees;
  
  if (!employees || !state.step2?.packageId) {
    console.error("Missing required data:", state);
    return { total: 0 };
  }

  const pkg = resolvePackage(packages as Package[], state.step2.packageId);
  if (!pkg) {
    return { total: 0 };
  }

  const tab = resolveTabulator(pkg.tabuladores, employees);

  const packageCost = calculatePackageCost(tab as any, employees);

  const biometricsCost = calculateBiometricsCost(
    state.step3?.bioRequired || false,
    state.step3?.bioCount || 0,
    state.step3?.bioType || null
  );

  return {
    package: pkg.nombre,
    employees,
    breakdown: {
      packageCost,
      biometricsCost,
    },
    total: packageCost + biometricsCost,
  };
}
