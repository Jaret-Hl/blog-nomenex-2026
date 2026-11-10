// Reglas de horario para las asesorías (hora de México por defecto).
export const ANTICIPACION_MIN_HORAS = 2;
export const ANTICIPACION_MAX_DIAS = 60;
export const HORA_INICIO = 9;
export const HORA_FIN = 18;
export const DURACION_MIN = 15;
export const DURACION_MAX = 120;

/** Devuelve el motivo por el que no se puede agendar, o null si el horario es válido. */
export function validarHorario(inicio: Date, fin: Date, zona: string, ahora = Date.now()): string | null {
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
    return "El horario no es válido.";
  }
  if (inicio.getTime() < ahora + ANTICIPACION_MIN_HORAS * 3600_000) {
    return `Agenda con al menos ${ANTICIPACION_MIN_HORAS} horas de anticipación.`;
  }
  if (inicio.getTime() > ahora + ANTICIPACION_MAX_DIAS * 86_400_000) {
    return `Solo puedes agendar con ${ANTICIPACION_MAX_DIAS} días de anticipación.`;
  }

  const diaSemana = new Intl.DateTimeFormat("en-US", { timeZone: zona, weekday: "short" }).format(inicio);
  if (diaSemana === "Sat" || diaSemana === "Sun") return "Las asesorías son de lunes a viernes.";

  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: zona, hour: "numeric", hourCycle: "h23" }).format(inicio));
  if (hora < HORA_INICIO || hora >= HORA_FIN) {
    return `Las asesorías son de ${HORA_INICIO}:00 a ${HORA_FIN}:00 (hora de ${zona}).`;
  }

  const minutos = (fin.getTime() - inicio.getTime()) / 60_000;
  if (minutos < DURACION_MIN || minutos > DURACION_MAX) return "La duración de la sesión no es válida.";

  return null;
}
