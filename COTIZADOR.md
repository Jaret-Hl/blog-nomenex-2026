# Cotizador NOMENEX · guía de mantenimiento (Tarifa 2027)

Todo lo que cambia el negocio vive en archivos separados. No hace falta tocar componentes para cambiar precios o textos.

| Qué cambiar | Dónde |
|---|---|
| Precios: lista de 1 a 5 colaboradores, tramos, extras por paquete, descuento, redondeo, vigencia | `src/config/precios.ts` → `tarifa` |
| Periodicidad de la nómina (factor semanal, quincenal, mensual) | `src/config/precios.ts` → `periodicidad` |
| Registros patronales, salarios variables, nóminas, razones sociales | `src/config/precios.ts` → `registros`, `salarios`, `nominas`, `razones` |
| Complementos y accesorios (precio, descripción, grupo, tipo) | `src/config/precios.ts` → `complementos` |
| Orden de los grupos en el paso Complementos | `src/config/precios.ts` → `ordenGrupos` |
| IVA | `src/config/precios.ts` → `iva` |
| Nombre, promesa y servicios de cada paquete | `src/data/paquetes.json` |
| Límites de captura (colaboradores, equipos, razones, nóminas) | `src/lib/quote/validacion.ts` |
| Pasos del cotizador | `src/config/pasos.ts` |
| Textos del banner | `src/sections/Hero.astro` |
| Contenido de los correos | `src/lib/quote/emailTemplates.ts` y `src/lib/mail/asesoria.ts` |
| Colores y tipografía | `src/styles/cotizador.css` y `src/layouts/Layout.astro` |

## Cómo está organizado

- **Motor de precios:** `src/lib/pricing/tarifa.ts`. Calcula la cotización completa (paquete, razones, registros, salarios, nóminas, complementos, IVA y pago único). Es la única fuente de totales: la interfaz, los correos y las acciones del servidor usan esta misma función.
- **Verificación:** el motor replica las fórmulas del cotizador de referencia y se comprobó contra 600 casos (incluidos los de cotización a la medida).
- **Interfaz:** `src/components/cotizador/` (un componente por paso y piezas reutilizables) y `src/lib/cotizador/app.ts` (comportamiento en el navegador).
- **Acciones del servidor:** `src/actions/sendQuote.server.ts` y `src/actions/bookSession.server.ts`. Vuelven a validar y recalcular la cotización; no confían en el navegador.
- La agenda (Teams) se abre desde `BookingModal` con `window.openBookingModal`.

## Variables de entorno (`.env`)

Obligatorias: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `MS_USER_EMAIL`.
Opcionales: `MS_QUOTE_NOTIFY_EMAIL`, `MS_TIMEZONE`, `PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` (deben ir las dos), `MAX_CORREOS_DIA`.

## Validaciones de un envío

- Colaboradores de 1 a 1000 (más de 200 se marca como cotización a la medida); razones sociales y registros de 1 a 50; nóminas de 1 a 20; asimilados de 0 a 20.
- Periodicidad y tipo de salario deben ser valores permitidos; el paquete y los complementos deben existir en el catálogo.
- Biométricos de 1 a 100 equipos.
- Nombre, empresa y correo válidos; teléfono opcional de 10 dígitos; aviso de privacidad obligatorio.
- Anti-spam: campo trampa, límites por conexión y por correo, bloqueo de correos desechables, tope diario de correos y verificación anti-bots opcional.

## Pendientes de negocio

Los precios marcados como "PROPUESTA POR VALIDAR" en `precios.ts` deben confirmarse contra costos antes de publicar.
La agenda del cotizador de referencia (calendario, modalidad y recordatorio por WhatsApp) no se aplicó: el blog agenda con Teams.
