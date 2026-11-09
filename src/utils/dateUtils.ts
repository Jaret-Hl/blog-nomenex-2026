export function getTodayInMexicoCity(): string {
  const today = new Date().toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return today.split('/').reverse().join('-');
}

export function parseTimeInMexicoCity(dateTimeString: string): string {
  const date = new Date(dateTimeString + 'Z');
  return date.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function getCurrentTimeInMexicoCity(): { hour: number; minute: number } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString + 'T12:00:00');
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

export function isRestDay(dateString: string): boolean {
  // Lista de días festivos mexicanos (formato YYYY-MM-DD)
  const holidays = [
    '2026-01-01', // Año Nuevo
    '2026-02-02', // Día de la Constitución (primer lunes de febrero)
    '2026-03-16', // Natalicio de Benito Juárez (tercer lunes de marzo)
    '2026-05-01', // Día del Trabajo
    '2026-09-16', // Día de la Independencia
    '2026-11-02', // Día de Muertos
    '2026-11-16', // Día de la Revolución (tercer lunes de noviembre)
    '2026-12-25', // Navidad
    // Agrega más días festivos según necesites
  ];
  
  return isWeekend(dateString) || holidays.includes(dateString);
}