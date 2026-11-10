# Cotizador NOMENEX · guía de mantenimiento

Todo lo que cambia el negocio vive en archivos separados. No hace falta tocar componentes para actualizar precios o textos.

| Qué cambiar | Dónde |
|---|---|
| Precios (cuota base, tramos, cargo por paquete, mínimo Premium) | `src/config/precios.ts` → `escala`, `paquetes` |
| Cargo por sedes (porcentajes) | `src/config/precios.ts` → `sedes` |
| Complementos (precio, descripción, grupo, tipo) | `src/config/precios.ts` → `complementos` |
| IVA | `src/config/precios.ts` → `iva` |
| Nombre, promesa, etiqueta y servicios de cada paquete | `src/data/paquetes.json` |
| Nivel en el que se incluye cada servicio | `src/data/paquetes.json` → `items[].desde` (1 = Básico, 2 = Profesional, 3 = Premium) |
| Límite de colaboradores, equipos y sedes | `src/lib/quote/validacion.ts` |
| Pasos del cotizador | `src/config/pasos.ts` |
| Textos del banner | `src/sections/Hero.astro` |
| Correos (asunto y contenido) | `src/lib/quote/emailTemplates.ts` |
| Colores y tipografía | `src/styles/cotizador.css` y `src/layouts/Layout.astro` (`@theme`) |

## Cómo está organizado

- `src/components/cotizador/`: un componente por paso (`PasoEmpresa`, `PasoPaquetes`, `PasoComplementos`, `PasoResumen`) y piezas reutilizables (`PlanCard`, `ComparativaTabla`).
- `src/lib/cotizador/app.ts`: comportamiento en el navegador (navegación, precios en vivo, complementos, resumen y envío).
- `src/lib/quote/mapeo.ts`: convierte la cotización en el cálculo oficial. Es la única fuente de totales, tanto en pantalla como en el servidor.
- `src/lib/quote/validacion.ts`: reglas compartidas por el formulario y el servidor.
- `src/actions/sendQuote.server.ts`: recalcula en el servidor, valida, aplica límite de envíos y envía los correos.
- La agenda (Teams) se abre desde `BookingModal` con `window.openBookingModal`. No cambia.

## Variables de entorno (`.env`)

Copia `.env.example` a `.env`. Son obligatorias: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `MS_USER_EMAIL`. Si falta alguna o tiene formato inválido, el envío de correos muestra un error claro en el registro del servidor.

## Validaciones de un envío

- Colaboradores entre 1 y 1000 (más de 200 se marca como cotización a la medida).
- Sedes, paquete y complementos deben existir en el catálogo; los demás se descartan.
- Biométricos entre 1 y 100 equipos.
- Nombre, empresa y correo válidos; teléfono opcional de 10 dígitos.
- Aceptar el aviso de privacidad es obligatorio.
- Campo trampa para bots y límite de 5 envíos por 15 minutos por conexión y de 3 por correo.
