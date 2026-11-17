# Equipo y organigrama · guía

Todo lo del equipo vive en pocos archivos.

| Qué cambiar | Dónde |
|---|---|
| Datos de una persona (nombre, cargo, lema, teléfono, correo, servicios) | `src/data/equipo.ts` |
| Quién reporta a quién (ramas del organigrama) | `reportaA` en `src/data/equipo.ts` |
| Vacantes | Objetos con `tipo: "vacante"` en `src/data/equipo.ts` |
| Foto de una persona | `public/equipo/<id>.webp` (cuadrada, 480 px aprox.) |
| Diseño del organigrama y de la tarjeta | `src/components/equipo/` y `src/styles/equipo.css` |
| Datos de la empresa (sitio, texto del botón) | `src/config/empresa.ts` |

## Importante

- Cada persona debe **aceptar por escrito** que se publiquen su foto y sus datos de contacto. Sin ese consentimiento, quitar a la persona del archivo.
- El aviso de privacidad debe mencionar la publicación de estos datos.
- El código QR y el archivo de contacto se generan al construir el sitio; no hay que mantenerlos a mano.
