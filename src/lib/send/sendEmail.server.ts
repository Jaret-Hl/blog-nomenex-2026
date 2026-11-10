import { getMicrosoftToken } from "../microsoftAuth.server";
import { getEnv } from "../config/env.server";
import { validarCorreo } from "../quote/validacion";

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  adjuntos?: { nombre: string; tipo: string; contenido: string }[];
}

export async function sendMail({ to, subject, html, replyTo, adjuntos }: SendMailParams) {
  const errorDestino = validarCorreo(to);
  if (errorDestino) throw new Error(`Destinatario inválido: ${to}`);
  if (replyTo && validarCorreo(replyTo)) throw new Error("Correo de respuesta inválido");

  const env = getEnv();
  const token = await getMicrosoftToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${env.MS_USER_EMAIL}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          ...(replyTo ? { replyToRecipients: [{ emailAddress: { address: replyTo } }] } : {}),
          toRecipients: [{ emailAddress: { address: to } }],
          ...(adjuntos?.length
            ? {
                attachments: adjuntos.map((a) => ({
                  "@odata.type": "#microsoft.graph.fileAttachment",
                  name: a.nombre,
                  contentType: a.tipo,
                  contentBytes: a.contenido,
                })),
              }
            : {}),
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando correo: ${error}`);
  }
}
