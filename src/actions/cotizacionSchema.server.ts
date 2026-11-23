// Esquema único de la cotización que llega a las acciones del servidor.
import { z } from "astro:schema";

const periodo = z.enum(["semanal", "quincenal", "mensual"]);

export const cotizacionSchema = z.object({
  colaboradores: z.coerce.number(),
  razones: z.coerce.number(),
  registros: z.coerce.number(),
  salarios: z.enum(["fijos", "variables"]),
  nominas: z.coerce.number(),
  periodo,
  asimilados: z.coerce.number(),
  periodoAsim: periodo,
  paquete: z.string().max(40).nullable(),
  complementos: z.array(z.string().max(40)).max(50),
  equipos: z.coerce.number(),
});
