// Acciones del servidor. El flujo del cotizador no usa cookies: cada envío trae la cotización completa.
import { bookSession } from "./bookSession.server";
import { sendQuote } from "./sendQuote.server";

export const server = {
  bookSession,
  sendQuote,
};
