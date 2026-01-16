export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface ScheduleItem {
  start: { dateTime: string };
  end: { dateTime: string };
}

export interface AvailabilityResponse {
  value?: Array<{
    scheduleItems: ScheduleItem[];
  }>;
}

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const SLOT_INTERVAL_MINUTES = 30;

export function generateTimeSlots(scheduleItems: ScheduleItem[]): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
    for (let minute of [0, SLOT_INTERVAL_MINUTES]) {
      const time = formatTime(hour, minute);
      const available = !isSlotBusy(time, scheduleItems);
      slots.push({ time, available });
    }
  }

  return slots;
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function isSlotBusy(time: string, scheduleItems: ScheduleItem[]): boolean {
  return scheduleItems.some((item) => {
    const startDate = new Date(item.start.dateTime + 'Z');
    const endDate = new Date(item.end.dateTime + 'Z');
    
    const start = startDate.toLocaleTimeString('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const end = endDate.toLocaleTimeString('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return time >= start && time < end;
  });
}

export function calculateEndTime(date: string, time: string): string {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hora
  return end.toISOString();
}
