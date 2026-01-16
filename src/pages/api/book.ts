import { getMicrosoftToken } from "@/lib/microsoftAuth";
import type { APIContext } from "astro";

export async function POST({ request }: APIContext) {
  const { start, end, client } = await request.json();
  const token = await getMicrosoftToken();

  // Zona horaria de México
  const timezone = "America/Mexico_City";

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${import.meta.env.MS_USER_EMAIL}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: "Sesión de asesoría",
        start: { dateTime: start, timeZone: timezone },
        end: { dateTime: end, timeZone: timezone },
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
        attendees: [
          {
            emailAddress: {
              address: client.email,
              name: client.name,
            },
            type: "required",
          },
        ],
      }),
    }
  );

  return new Response(await res.text(), { status: 200 });
}
