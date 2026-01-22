// import { AZURE_TENANT_ID } from './../../.astro/env.d';
export async function getMicrosoftToken() {
  const url = `https://login.microsoftonline.com/${import.meta.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: import.meta.env.AZURE_CLIENT_ID!,
    client_secret: import.meta.env.AZURE_CLIENT_SECRET!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Error obteniendo token de Microsoft Graph");
  }

  const data = await res.json();
  return data.access_token;
}
