// Iconos de cada grupo de servicios (trazos simples, mismo estilo que el cotizador).
const base = (cuerpo: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">${cuerpo}</svg>`;

export const ICONOS: Record<string, string> = {
  nomina: base('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  escudo: base('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  reloj: base('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  personas: base('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 010 7M18 14c2 .6 3 2.6 3 6"/>'),
  grafica: base('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  lupa: base('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>'),
  balanza: base('<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0zM8 21h8"/>'),
};
