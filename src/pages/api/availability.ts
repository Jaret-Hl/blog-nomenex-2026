import { getMicrosoftToken } from "@/lib/microsoftAuth.server";
import type { APIContext } from "astro";

export async function POST({ request }: APIContext) {
  const { date } = await request.json();
  const token = await getMicrosoftToken();

  // Usar zona horaria de México
  const timezone = "America/Mexico_City";
  const start = `${date}T09:00:00`;
  const end = `${date}T18:00:00`;

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${import.meta.env.MS_USER_EMAIL}/calendar/getSchedule`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schedules: [import.meta.env.MS_USER_EMAIL],
        startTime: { dateTime: start, timeZone: timezone },
        endTime: { dateTime: end, timeZone: timezone },
        availabilityViewInterval: 30,
      }),
    }
  );

  return new Response(await res.text(), { status: 200 });
}
