// src/lib/pricing/types.ts
export interface WizardState {
  step1: {
    employees: number | null;
    /** Número de sedes, centros de trabajo o sucursales. */
    locations: string | number | null;
  };
  step2: {
    packageId: string | null;
    /** Ids de complementos elegidos en el comparativo (sin incluir biométricos). */
    complementos?: string[];
  };
  step3: {
    bioRequired: boolean | null;
    bioCount: number | null;
    /** Ya no afecta el precio: biométricos son en comodato. */
    bioType?: string | null;
  };
}

export interface QuoteBreakdown {
  paquete: number;
  sedes: number;
  complementosMensuales: number;
  subtotal: number;
  iva: number;
  totalMensual: number;
  complementosUnicos: number;
  ivaUnico: number;
  totalUnico: number;
  porColaborador: number;
}

export interface QuoteResult {
  /** Total mensual con IVA. null = cotización a la medida. */
  total: number | null;
  aMedida: boolean;
  package?: string;
  employees?: number;
  breakdown?: QuoteBreakdown;
  complementos?: { id: string; nombre: string; tipo: string; costo: number }[];
}
