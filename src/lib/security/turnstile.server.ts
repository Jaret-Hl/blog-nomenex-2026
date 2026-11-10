// Verificación anti-bots con Cloudflare Turnstile. Opcional: si no hay clave secreta, no se exige.
const URL_VERIFICACION = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** true = humano verificado · false = verificación fallida · null = Turnstile no configurado. */
export async function verificarTurnstile(token: string | null | undefined, ip: string): Promise<boolean | null> {
  const secreto = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secreto) {
    if (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) {
      console.warn("[turnstile] Hay PUBLIC_TURNSTILE_SITE_KEY pero falta TURNSTILE_SECRET_KEY: el formulario no pasará la verificación.");
    }
    return null;
  }
  if (!token || token.length > 2048) return false;

  try {
    const res = await fetch(URL_VERIFICACION, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secreto, response: token, remoteip: ip }),
    });
    const datos = (await res.json()) as { success?: boolean };
    return datos.success === true;
  } catch (error) {
    console.error("[turnstile] Error verificando token:", error);
    return false;
  }
}
