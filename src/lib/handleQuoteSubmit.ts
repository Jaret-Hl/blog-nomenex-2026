import { getWizardData, organizeDataBySteps } from "../utils/wizard";
import type { ContactData, QuoteData } from "../types/wizard";
import { calculateQuote } from "./pricing/calculateQuote";
import type { WizardState } from "./pricing/types";
import { sanitizeInput } from "@/utils/sanitize";
import { sendMail } from "@/lib/send/sendEmail.server";

function convertToWizardState(wizardData: any): WizardState {
  return {
    step1: {
      employees: wizardData.company?.employees || null,
      locations: wizardData.company?.locations || null,
    },
    step2: {
      packageId: wizardData.packageId || null,
    },
    step3: {
      bioRequired: wizardData.biometric?.bioRequired || false,
      bioCount: wizardData.biometric?.bioCount || null,
      bioType: wizardData.biometric?.bioType || null,
    },
  };
}

export async function handleQuoteSubmit(event: Event) {
  event.preventDefault();
  // Obtener todos los datos del wizard
  const wizardData = getWizardData();

  // Organizar datos por steps
  const stepData = organizeDataBySteps(wizardData);

  // Calcular cotización
  const wizardState = convertToWizardState(wizardData);
  const quote = calculateQuote(wizardState);

  // Obtener datos del formulario de contacto
  const contactForm = document.getElementById("contactForm") as HTMLFormElement;
  const formData = new FormData(contactForm);

  // Sanitizar todos los inputs
  const name = sanitizeInput.text(formData.get("name") as string || "");
  const email = sanitizeInput.email(formData.get("email") as string || "");
  const phone = sanitizeInput.text(formData.get("phone") as string || "");
  const message = sanitizeInput.text(formData.get("message") as string || "");

  // Validaciones básicas
  if (!name || name.length < 2) {
    alert("Por favor ingresa un nombre válido");
    return;
  }

  if (!email) {
    alert("Por favor ingresa un email válido");
    return;
  }

  try {
    await sendMail({
      to: email,
      subject: "Cotización recibida",
      html: `
        <h2>Hola ${name}</h2>
        <p>Hemos recibido tu solicitud de cotización.</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    });

    alert("Cotización enviada exitosamente");
    contactForm.reset();
  } catch (error) {
    alert("Error al enviar la cotización. Intenta nuevamente.");
    throw error;
  }

  // Crear objeto completo para envío de email
  const contactData: ContactData = {
    userName: formData.get("userName") as string,
    userCompany: formData.get("userCompany") as string,
    userEmail: formData.get("userEmail") as string,
    userPhone: formData.get("userPhone") as string,
  };

  const quoteData: QuoteData = {
    ...wizardData,
    contact: contactData,
    quote: quote, // Agregar resultado de cotización
    timestamp: new Date().toISOString(),
  };
  // console.log("Quote Data to be sent via email:", quoteData);
  /* 
  
  // Aquí puedes agregar el envío real del email
  // await actions.sendQuoteEmail({ quoteData });
  
  return { quoteData, stepData, contactData }; */
}
