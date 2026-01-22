
import { getMicrosoftToken } from "../microsoftAuth.server";

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailParams) {
  const token = await getMicrosoftToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${import.meta.env.MS_USER_EMAIL}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: html,
          },
          toRecipients: [
            {
              emailAddress: { address: to },
            },
          ],
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
