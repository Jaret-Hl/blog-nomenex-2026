// Actualiza en vivo los precios de los pasos 2, 3 y 4 usando la misma lógica que el servidor.
import { PRECIOS, type PaqueteId } from '@/config/precios';
import { calculateQuote } from './calculateQuote';
import { precioPaquete } from './escala';
import { porcentajeSedes } from './sedes';
import type { WizardState } from './types';

const fmt2 = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CLAVES = [
  'total-mensual', 'total-unico', 'bio-costo',
  'resumen-paquete', 'resumen-colaboradores', 'resumen-sedes', 'resumen-paquete-monto',
  'resumen-sedes-monto', 'resumen-bio-monto', 'resumen-complementos-monto', 'resumen-subtotal',
  'resumen-iva', 'resumen-total', 'resumen-por-colaborador', 'resumen-unico',
  'resumen-unico-iva', 'resumen-unico-total',
];

function escribir(clave: string, texto: string) {
  document.querySelectorAll<HTMLElement>(`[data-live="${clave}"]`).forEach(el => (el.textContent = texto));
}

function mostrar(clave: string, visible: boolean) {
  document.querySelectorAll<HTMLElement>(`[data-live="${clave}"]`).forEach(el => el.classList.toggle('hidden', !visible));
}

function leerEstado(): WizardState {
  const valor = (sel: string) =>
    (document.querySelector(sel) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
  const yes = (document.getElementById('bioNeededYes') as HTMLInputElement | null)?.checked;
  const no = (document.getElementById('bioNeededNo') as HTMLInputElement | null)?.checked;

  return {
    step1: {
      employees: parseInt(valor('#employeeCount')) || null,
      locations: valor('#locations') || null,
    },
    step2: {
      packageId: valor('#selectedPackageId') || null,
      complementos: Array.from(
        document.querySelectorAll<HTMLInputElement>('input[data-complemento]:checked')
      ).map(el => el.dataset.complemento!),
    },
    step3: {
      bioRequired: yes ? true : no ? false : null,
      bioCount: parseInt(valor('#bioCount')) || 0,
    },
  };
}

export function recalcular(): void {
  const estado = leerEstado();
  const n = estado.step1.employees ?? 0;
  const paquete = estado.step2.packageId as PaqueteId | null;
  const bio = PRECIOS.complementos.find(c => c.id === 'bio')!;
  const equipos = estado.step3.bioRequired ? estado.step3.bioCount ?? 0 : 0;

  // Precio base de cada tarjeta de paquete
  document.querySelectorAll<HTMLElement>('[data-precio-paquete]').forEach(el => {
    const p = n > 0 ? precioPaquete(n, el.dataset.precioPaquete as PaqueteId) : 0;
    el.textContent = p === null ? 'A la medida' : p ? fmt2(p) : '—';
  });

  escribir('bio-costo', equipos > 0 ? fmt2(equipos * bio.precio) : '—');

  const q = calculateQuote(estado);
  if (!paquete || !n || !q.breakdown) {
    CLAVES.forEach(c => escribir(c, '—'));
    mostrar('resumen-unico-bloque', false);
    document.querySelectorAll<HTMLElement>('[data-live="resumen-complementos-lista"]').forEach(ul => ul.replaceChildren());
    return;
  }

  if (q.aMedida) {
    CLAVES.forEach(c => escribir(c, 'A la medida'));
    return;
  }

  const b = q.breakdown;
  const bioCosto = q.complementos?.find(c => c.id === 'bio')?.costo ?? 0;
  const mensualSinBio = b.complementosMensuales - bioCosto;
  const sedesTxt = document.querySelector<HTMLSelectElement>('#locations')?.selectedOptions[0]?.text ?? '';
  const pct = Math.round(porcentajeSedes(Number(estado.step1.locations)) * 100);

  escribir('total-mensual', fmt2(b.totalMensual) + ' con IVA');
  escribir('total-unico', b.complementosUnicos > 0 ? fmt2(b.totalUnico) + ' con IVA' : '—');
  escribir('resumen-paquete', q.package ?? '');
  escribir('resumen-colaboradores', String(n));
  escribir('resumen-sedes', `${sedesTxt}${pct ? ` (+${pct} %)` : ''}`);
  escribir('resumen-paquete-monto', fmt2(b.paquete));
  escribir('resumen-sedes-monto', fmt2(b.sedes));
  escribir('resumen-bio-monto', bioCosto > 0 ? fmt2(bioCosto) : '—');
  escribir('resumen-complementos-monto', mensualSinBio > 0 ? fmt2(mensualSinBio) : '—');
  escribir('resumen-subtotal', fmt2(b.subtotal));
  escribir('resumen-iva', fmt2(b.iva));
  escribir('resumen-total', fmt2(b.totalMensual));
  escribir('resumen-por-colaborador', `Equivale a ${fmt2(b.totalMensual / n)} por colaborador al mes, con IVA.`);

  mostrar('resumen-unico-bloque', b.complementosUnicos > 0);
  escribir('resumen-unico', fmt2(b.complementosUnicos));
  escribir('resumen-unico-iva', fmt2(b.ivaUnico));
  escribir('resumen-unico-total', fmt2(b.totalUnico));

  document.querySelectorAll<HTMLElement>('[data-live="resumen-complementos-lista"]').forEach(ul => {
    ul.replaceChildren(
      ...(q.complementos ?? [])
        .filter(c => c.id !== 'bio' && c.tipo !== 'unico')
        .map(c => {
          const li = document.createElement('li');
          li.textContent = `${c.nombre}: ${fmt2(c.costo)} al mes`;
          return li;
        })
    );
  });
}

let iniciado = false;

export function initCotizadorLive(): void {
  if (!iniciado) {
    iniciado = true;
    const actualizar = () => setTimeout(recalcular, 0);
    ['input', 'change', 'click'].forEach(ev => document.addEventListener(ev, actualizar));
    ['wizard:next', 'wizard:prev', 'wizard:goto'].forEach(ev => document.addEventListener(ev, actualizar));
  }
  recalcular();
}
