import { actions } from "astro:actions";

function avisar(mensaje: string, tipo: "error" | "success" = "error") {
  if (typeof window.showAlert === "function") {
    window.showAlert(mensaje, tipo);
  } else {
    alert(mensaje);
  }
}

// Envía la cotización por correo. Los precios se recalculan en el servidor desde la cookie del wizard.
export async function handleQuoteSubmit(event: Event): Promise<boolean> {
  event.preventDefault();

  const form = document.getElementById("contactForm") as HTMLFormElement | null;
  if (!form) return false;

  const fd = new FormData(form);
  const campo = (nombre: string) => String(fd.get(nombre) ?? "").trim();

  const resultado = await actions.sendQuote({
    nombre: campo("userName"),
    empresa: campo("userCompany"),
    correo: campo("userEmail"),
    telefono: campo("userPhone"),
    website: campo("website"),
  });

  if (resultado.error) {
    avisar(resultado.error.message || "Error al enviar la cotización. Intenta nuevamente.");
    return false;
  }

  avisar("Cotización enviada. Revisa tu correo.", "success");
  form.reset();
  return true;
}
