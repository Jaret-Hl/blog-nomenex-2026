import type { Package, Tabulator } from "./types";

// encontrar el paquete basado en el ID
export function resolvePackage(
  packages: Package[],
  packageId: string
): Package | undefined {
  return packages.find(p => p.id === packageId) ?? undefined;
}

// encontrar el tabulador adecuado basado en el número de empleados
export function resolveTabulator(
  tabuladores: Tabulator[],
  employees: number
): Tabulator | undefined {
  return tabuladores.find(
    t => employees >= t.min && employees <= t.max
  ) ?? undefined;
}