// src/lib/pricing/types.ts
export type TabulatorType = "mensual" | "unitario";

export interface Tabulator {
  min: number;
  max: number;
  precio: number;
  tipo: "mensual" | "unitario";
}

export interface Caracteristica {
  key: string;
  label: string;
  incluido: boolean;
  nota?: string;
  detalle?: string;
  limite?: string;
}

export interface Condiciones {
  membresia_cadi: string;
  asesoria_legal: string;
  ejecutivo_cuenta: string;
  implant_oficina: boolean | string;
  ubicaciones: string;
  registros_patronales: string;
  tipo_prestaciones: string;
}

export interface Package {
  id: string;
  nombre: string;
  etiqueta: string;
  orden: number;
  ui: {
    border: string;
    highlight: boolean;
  };
  caracteristicas: Caracteristica[];
  condiciones: Condiciones;
  tabuladores: Tabulator[];
  addonsIncluidos: string[];
}

export interface WizardState {
  step1: {
    employees: number;
    locations: string;
  };
  step2: {
    packageId: string;
  };
  step3: {
    bioRequired: boolean;
    bioCount: number;
    bioType: "basic" | "advanced" | "terminal";
  };
}
