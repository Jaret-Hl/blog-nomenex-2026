import { getMicrosoftToken } from "@/lib/microsoftAuth";

export async function GET() {
  const token = await getMicrosoftToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${import.meta.env.MS_USER_EMAIL}/calendar`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: 200 });
}
