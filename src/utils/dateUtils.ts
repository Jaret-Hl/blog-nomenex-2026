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
