import { getWizardData, organizeDataBySteps } from "../utils/wizard";
import type { ContactData, QuoteData } from "../types/wizard";
import { calculateQuote } from "./pricing/calculateQuote";
import type { WizardState } from "./pricing/types";

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

export function handleQuoteSubmit(event: Event) {
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

  const contactData: ContactData = {
    userName: formData.get("userName") as string,
    userCompany: formData.get("userCompany") as string,
    userEmail: formData.get("userEmail") as string,
    userPhone: formData.get("userPhone") as string,
  };

  // Crear objeto completo para envío de email
  const quoteData: QuoteData = {
    ...wizardData,
    contact: contactData,
    quote: quote, // Agregar resultado de cotización
    timestamp: new Date().toISOString(),
  };
  console.log("Quote Data to be sent via email:", quoteData);
  /* 
  
  // Aquí puedes agregar el envío real del email
  // await actions.sendQuoteEmail({ quoteData });
  
  return { quoteData, stepData, contactData }; */
}
